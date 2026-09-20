import { resolve4, resolve6, resolveMx, resolveNs } from "node:dns/promises";
import { connect } from "node:tls";
import { getDomain } from "tldts";
import type { RawDomainIntelligenceDto } from "../src/types/purchase";

const IANA_RDAP_BOOTSTRAP_URL = "https://data.iana.org/rdap/dns.json";
const LOOKUP_TIMEOUT_MS = 6_000;
const BOOTSTRAP_CACHE_MS = 24 * 60 * 60 * 1_000;

interface RdapBootstrap {
  services: Array<[string[], string[]]>;
}

interface RdapLookup {
  registrationDateIso: string | null;
  domainAgeDays: number | null;
  registrarName: string | null;
  sourceUrl: string | null;
}

interface DnsLookup {
  nameserverCount: number | null;
  mailServerCount: number | null;
  addressCount: number | null;
}

interface TlsLookup {
  reachable: boolean;
  authorized: boolean | null;
  validToIso: string | null;
  issuer: string | null;
}

let bootstrapCache:
  | {
      expiresAt: number;
      data: RdapBootstrap;
    }
  | null = null;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isRdapBootstrap = (value: unknown): value is RdapBootstrap => {
  const record = asRecord(value);

  if (!record || !Array.isArray(record.services)) {
    return false;
  }

  return record.services.every(
    (entry) =>
      Array.isArray(entry) &&
      entry.length >= 2 &&
      isStringArray(entry[0]) &&
      isStringArray(entry[1]),
  );
};

const toIso = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const timestamp = Date.parse(value);

  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
};

async function fetchJson(
  url: string,
  accept = "application/json",
): Promise<{ payload: unknown; finalUrl: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        accept,
        "user-agent":
          "BackstopBot/0.2 (+https://backstop.local; purchase-intelligence prototype)",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return {
      payload: (await response.json()) as unknown,
      finalUrl: response.url,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function getBootstrap(): Promise<RdapBootstrap | null> {
  if (bootstrapCache && bootstrapCache.expiresAt > Date.now()) {
    return bootstrapCache.data;
  }

  try {
    const { payload } = await fetchJson(IANA_RDAP_BOOTSTRAP_URL);

    if (!isRdapBootstrap(payload)) {
      return null;
    }

    bootstrapCache = {
      data: payload,
      expiresAt: Date.now() + BOOTSTRAP_CACHE_MS,
    };

    return payload;
  } catch {
    return null;
  }
}

function parseRegistrarName(record: Record<string, unknown>): string | null {
  if (!Array.isArray(record.entities)) {
    return null;
  }

  for (const entityValue of record.entities) {
    const entity = asRecord(entityValue);

    if (!entity || !Array.isArray(entity.roles)) {
      continue;
    }

    const roles = entity.roles.filter(
      (role): role is string => typeof role === "string",
    );

    if (!roles.some((role) => role.toLowerCase() === "registrar")) {
      continue;
    }

    const vcard = entity.vcardArray;

    if (Array.isArray(vcard) && Array.isArray(vcard[1])) {
      for (const property of vcard[1]) {
        if (
          Array.isArray(property) &&
          property[0] === "fn" &&
          typeof property[3] === "string"
        ) {
          return property[3].trim() || null;
        }
      }
    }

    if (typeof entity.handle === "string") {
      return entity.handle.trim() || null;
    }
  }

  return null;
}

function parseRegistrationDate(record: Record<string, unknown>): string | null {
  if (!Array.isArray(record.events)) {
    return null;
  }

  for (const eventValue of record.events) {
    const event = asRecord(eventValue);

    if (
      !event ||
      typeof event.eventAction !== "string" ||
      event.eventAction.toLowerCase() !== "registration"
    ) {
      continue;
    }

    return toIso(event.eventDate);
  }

  return null;
}

async function inspectRdap(domain: string): Promise<RdapLookup> {
  const empty: RdapLookup = {
    registrationDateIso: null,
    domainAgeDays: null,
    registrarName: null,
    sourceUrl: null,
  };

  const bootstrap = await getBootstrap();

  if (!bootstrap) {
    return empty;
  }

  const tld = domain.split(".").at(-1)?.toLowerCase();

  if (!tld) {
    return empty;
  }

  const service = bootstrap.services.find(([tlds]) =>
    tlds.some((candidate) => candidate.toLowerCase() === tld),
  );

  const baseUrl = service?.[1]?.[0];

  if (!baseUrl) {
    return empty;
  }

  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const lookupUrl = new URL(`domain/${encodeURIComponent(domain)}`, normalizedBase);

  try {
    const { payload, finalUrl } = await fetchJson(
      lookupUrl.toString(),
      "application/rdap+json, application/json;q=0.9",
    );

    const record = asRecord(payload);

    if (!record) {
      return empty;
    }

    const registrationDateIso = parseRegistrationDate(record);

    const domainAgeDays =
      registrationDateIso === null
        ? null
        : Math.max(
            0,
            Math.floor(
              (Date.now() - Date.parse(registrationDateIso)) /
                (24 * 60 * 60 * 1_000),
            ),
          );

    return {
      registrationDateIso,
      domainAgeDays,
      registrarName: parseRegistrarName(record),
      sourceUrl: finalUrl,
    };
  } catch {
    return empty;
  }
}

async function inspectDns(domain: string): Promise<DnsLookup> {
  const resolveArray = async <T>(
    promise: Promise<T[]>,
  ): Promise<T[] | null> => {
    try {
      return await promise;
    } catch (error) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : null;

      if (code === "ENODATA" || code === "ENOTFOUND") {
        return [];
      }

      return null;
    }
  };

  const [nameservers, mailServers, ipv4, ipv6] = await Promise.all([
    resolveArray(resolveNs(domain)),
    resolveArray(resolveMx(domain)),
    resolveArray(resolve4(domain)),
    resolveArray(resolve6(domain)),
  ]);

  return {
    nameserverCount: nameservers?.length ?? null,
    mailServerCount: mailServers?.length ?? null,
    addressCount:
      ipv4 === null && ipv6 === null
        ? null
        : (ipv4?.length ?? 0) + (ipv6?.length ?? 0),
  };
}

function inspectTls(hostname: string): Promise<TlsLookup> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (result: TlsLookup) => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(result);
    };

    const socket = connect({
      host: hostname,
      port: 443,
      servername: hostname,
      rejectUnauthorized: false,
    });

    socket.setTimeout(LOOKUP_TIMEOUT_MS);

    socket.once("secureConnect", () => {
      const certificate = socket.getPeerCertificate();
      const issuer = certificate.issuer as
        | {
            CN?: string;
            O?: string;
          }
        | undefined;

      finish({
        reachable: true,
        authorized: socket.authorized,
        validToIso: toIso(certificate.valid_to),
        issuer: issuer?.CN ?? issuer?.O ?? null,
      });

      socket.end();
    });

    socket.once("timeout", () => {
      socket.destroy();

      finish({
        reachable: false,
        authorized: null,
        validToIso: null,
        issuer: null,
      });
    });

    socket.once("error", () => {
      finish({
        reachable: false,
        authorized: null,
        validToIso: null,
        issuer: null,
      });
    });
  });
}

export async function inspectDomain(
  url: URL,
): Promise<RawDomainIntelligenceDto> {
  const registrableDomain = getDomain(url.hostname) ?? url.hostname;

  const [rdap, dns, tls] = await Promise.all([
    inspectRdap(registrableDomain),
    inspectDns(registrableDomain),
    inspectTls(url.hostname),
  ]);

  return {
    registrableDomain,
    registrationDateIso: rdap.registrationDateIso,
    domainAgeDays: rdap.domainAgeDays,
    registrarName: rdap.registrarName,
    rdapSourceUrl: rdap.sourceUrl,
    nameserverCount: dns.nameserverCount,
    mailServerCount: dns.mailServerCount,
    addressCount: dns.addressCount,
    tlsReachable: tls.reachable,
    tlsAuthorized: tls.authorized,
    tlsValidToIso: tls.validToIso,
    tlsIssuer: tls.issuer,
  };
}
