import type { RawCompanyIntelligenceDto } from "../src/types/purchase";

const REQUEST_TIMEOUT_MS = 6_000;
const GLEIF_SEARCH_URL = "https://api.gleif.org/api/v1/lei-records";

export interface CompanySourcePage {
  label: string;
  text: string;
  url: string;
}

interface CompanyIdentityInput {
  merchantName: string;
  mainPageText: string;
  mainPageUrl: string;
  policyPages: CompanySourcePage[];
}

interface PublishedIdentity {
  legalName: string | null;
  companyNumber: string | null;
  vatNumber: string | null;
  sourceUrl: string | null;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const clean = (value: string): string => value.replace(/\s+/g, " ").trim();

const normalizeCompanyName = (value: string): string =>
  value
    .toLowerCase()
    .replace(
      /\b(limited|ltd|llc|incorporated|inc|plc|gmbh|bv|b\.v|sarl|srl|sas|pty|pte|company|co)\b/g,
      "",
    )
    .replace(/[^a-z0-9]/g, "");

const findLegalNames = (text: string): string[] => {
  const suffix =
    "(?:Limited|Ltd\\.?|LLC|L\\.L\\.C\\.?|Inc\\.?|Incorporated|PLC|P\\.L\\.C\\.?|GmbH|B\\.V\\.|BV|S\\.A\\.|S\\.R\\.L\\.|SRL|SARL|SAS|Pty Ltd|Pte Ltd|Company Limited|Co\\. Ltd\\.?)";

  const pattern = new RegExp(
    `\\b([A-Z][A-Za-z0-9&'’.-]*(?:\\s+[A-Z0-9][A-Za-z0-9&'’.-]*){0,8}\\s+${suffix})\\b`,
    "g",
  );

  return Array.from(text.matchAll(pattern))
    .map((match) => clean(match[1]))
    .filter((value, index, values) => values.indexOf(value) === index);
};

const findIdentifier = (
  text: string,
  patterns: RegExp[],
): string | null => {
  for (const pattern of patterns) {
    const match = pattern.exec(text);

    if (match?.[1]) {
      return clean(match[1]);
    }
  }

  return null;
};

const selectPublishedIdentity = (
  input: CompanyIdentityInput,
): PublishedIdentity => {
  const orderedPages = [
    ...input.policyPages
      .filter((page) => /terms|conditions/i.test(page.label))
      .map((page) => ({ ...page, priority: 3 })),
    ...input.policyPages
      .filter((page) => !/terms|conditions/i.test(page.label))
      .map((page) => ({ ...page, priority: 2 })),
    {
      label: "Merchant page",
      text: input.mainPageText,
      url: input.mainPageUrl,
      priority: 1,
    },
  ];

  const merchantKey = normalizeCompanyName(input.merchantName);

  let best:
    | {
        name: string;
        sourceUrl: string;
        sourceText: string;
        score: number;
      }
    | null = null;

  for (const page of orderedPages) {
    for (const name of findLegalNames(page.text)) {
      const normalized = normalizeCompanyName(name);

      let score = page.priority;

      if (
        merchantKey &&
        normalized &&
        (normalized.includes(merchantKey) || merchantKey.includes(normalized))
      ) {
        score += 10;
      }

      if (best === null || score > best.score) {
        best = {
          name,
          sourceUrl: page.url,
          sourceText: page.text,
          score,
        };
      }
    }
  }

  const identifierText =
    best?.sourceText ?? orderedPages.map((page) => page.text).join(" ");

  const companyNumber = findIdentifier(identifierText, [
    /(?:company|registration|registered)\s+(?:number|no\.?|#)\s*[:#-]?\s*([A-Z0-9-]{4,24})/i,
    /company\s+number\s+is\s+([A-Z0-9-]{4,24})/i,
  ]);

  const vatNumber = findIdentifier(identifierText, [
    /(?:vat|tax)\s+(?:id\s+)?(?:number|no\.?)\s*(?:is\s*)?[:#-]?\s*([A-Z]{0,3}[A-Z0-9-]{5,24})/i,
    /registered\s+vat\s+(?:id\s+)?(?:number|no\.?)\s*(?:is\s*)?[:#-]?\s*([A-Z]{0,3}[A-Z0-9-]{5,24})/i,
  ]);

  return {
    legalName: best?.name ?? null,
    companyNumber,
    vatNumber,
    sourceUrl: best?.sourceUrl ?? null,
  };
};

const getNestedRecord = (
  value: unknown,
  ...keys: string[]
): Record<string, unknown> | null => {
  let current = asRecord(value);

  for (const key of keys) {
    if (!current) {
      return null;
    }

    current = asRecord(current[key]);
  }

  return current;
};

const readString = (
  record: Record<string, unknown> | null,
  key: string,
): string | null => {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

const scoreGleifMatch = (
  published: PublishedIdentity,
  legalName: string,
  registeredAs: string | null,
): number => {
  if (
    published.companyNumber &&
    registeredAs &&
    normalizeCompanyName(published.companyNumber) ===
      normalizeCompanyName(registeredAs)
  ) {
    return 100;
  }

  if (!published.legalName) {
    return 0;
  }

  const expected = normalizeCompanyName(published.legalName);
  const actual = normalizeCompanyName(legalName);

  if (expected && expected === actual) {
    return 95;
  }

  if (
    expected.length >= 5 &&
    actual.length >= 5 &&
    (expected.includes(actual) || actual.includes(expected))
  ) {
    return 70;
  }

  return 0;
};

async function queryGleif(
  published: PublishedIdentity,
): Promise<
  Pick<
    RawCompanyIntelligenceDto,
    | "registryStatus"
    | "matchedLegalName"
    | "matchedCompanyNumber"
    | "matchedJurisdiction"
    | "matchedStatus"
    | "registryUrl"
    | "lei"
  >
> {
  if (!published.legalName) {
    return {
      registryStatus: "NOT_CHECKED",
      matchedLegalName: null,
      matchedCompanyNumber: null,
      matchedJurisdiction: null,
      matchedStatus: null,
      registryUrl: null,
      lei: null,
    };
  }

  const url = new URL(GLEIF_SEARCH_URL);

  url.searchParams.set("filter[entity.legalName]", published.legalName);
  url.searchParams.set("page[size]", "5");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/vnd.api+json, application/json;q=0.9",
        "user-agent":
          "BackstopBot/0.2 (+https://backstop.local; company-identity prototype)",
      },
    });

    if (!response.ok) {
      return {
        registryStatus: "UNAVAILABLE",
        matchedLegalName: null,
        matchedCompanyNumber: null,
        matchedJurisdiction: null,
        matchedStatus: null,
        registryUrl: null,
        lei: null,
      };
    }

    const payload = asRecord((await response.json()) as unknown);
    const data = Array.isArray(payload?.data) ? payload.data : [];

    let best:
      | {
          score: number;
          lei: string | null;
          legalName: string;
          registeredAs: string | null;
          jurisdiction: string | null;
          entityStatus: string | null;
          registrationStatus: string | null;
        }
      | null = null;

    for (const itemValue of data) {
      const item = asRecord(itemValue);
      const attributes = asRecord(item?.attributes);
      const entity = asRecord(attributes?.entity);
      const registration = asRecord(attributes?.registration);
      const legalNameRecord = asRecord(entity?.legalName);

      const legalName =
        readString(legalNameRecord, "name") ??
        readString(entity, "legalName");

      if (!legalName) {
        continue;
      }

      const registeredAs = readString(entity, "registeredAs");
      const score = scoreGleifMatch(published, legalName, registeredAs);

      if (best === null || score > best.score) {
        best = {
          score,
          lei:
            readString(attributes, "lei") ??
            readString(item, "id"),
          legalName,
          registeredAs,
          jurisdiction: readString(entity, "legalJurisdiction"),
          entityStatus: readString(entity, "status"),
          registrationStatus: readString(registration, "status"),
        };
      }
    }

    if (!best || best.score < 70) {
      return {
        registryStatus: "NO_MATCH",
        matchedLegalName: null,
        matchedCompanyNumber: null,
        matchedJurisdiction: null,
        matchedStatus: null,
        registryUrl: null,
        lei: null,
      };
    }

    const matchedStatus =
      [best.entityStatus, best.registrationStatus]
        .filter((value): value is string => Boolean(value))
        .join(" · ") || null;

    return {
      registryStatus: "MATCHED",
      matchedLegalName: best.legalName,
      matchedCompanyNumber: best.registeredAs,
      matchedJurisdiction: best.jurisdiction,
      matchedStatus,
      registryUrl: best.lei
        ? `https://api.gleif.org/api/v1/lei-records/${encodeURIComponent(best.lei)}`
        : null,
      lei: best.lei,
    };
  } catch {
    return {
      registryStatus: "UNAVAILABLE",
      matchedLegalName: null,
      matchedCompanyNumber: null,
      matchedJurisdiction: null,
      matchedStatus: null,
      registryUrl: null,
      lei: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function inspectCompanyIdentity(
  input: CompanyIdentityInput,
): Promise<RawCompanyIntelligenceDto> {
  const published = selectPublishedIdentity(input);
  const registry = await queryGleif(published);

  return {
    publishedLegalName: published.legalName,
    publishedCompanyNumber: published.companyNumber,
    publishedVatNumber: published.vatNumber,
    publishedSourceUrl: published.sourceUrl,
    registryProvider: "GLEIF",
    ...registry,
  };
}
