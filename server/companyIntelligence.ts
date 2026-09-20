import type { RawCompanyIntelligenceDto } from "../src/types/purchase";

const REQUEST_TIMEOUT_MS = 6_000;
const OPEN_CORPORATES_SEARCH_URL =
  "https://api.opencorporates.com/v0.4/companies/search";

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
    best?.sourceText ??
    orderedPages.map((page) => page.text).join(" ");

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

const scoreRegistryMatch = (
  published: PublishedIdentity,
  company: Record<string, unknown>,
): number => {
  const name = typeof company.name === "string" ? company.name : "";
  const number =
    typeof company.company_number === "string" ? company.company_number : "";

  if (
    published.companyNumber &&
    number &&
    published.companyNumber.toLowerCase() === number.toLowerCase()
  ) {
    return 100;
  }

  if (!published.legalName || !name) {
    return 0;
  }

  const expected = normalizeCompanyName(published.legalName);
  const actual = normalizeCompanyName(name);

  if (expected && expected === actual) {
    return 90;
  }

  if (
    expected.length >= 5 &&
    actual.length >= 5 &&
    (expected.includes(actual) || actual.includes(expected))
  ) {
    return 60;
  }

  return 0;
};

async function queryOpenCorporates(
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
  >
> {
  const apiToken = process.env.OPENCORPORATES_API_TOKEN?.trim();

  if (!published.legalName) {
    return {
      registryStatus: "NOT_CHECKED",
      matchedLegalName: null,
      matchedCompanyNumber: null,
      matchedJurisdiction: null,
      matchedStatus: null,
      registryUrl: null,
    };
  }

  if (!apiToken) {
    return {
      registryStatus: "NOT_CONFIGURED",
      matchedLegalName: null,
      matchedCompanyNumber: null,
      matchedJurisdiction: null,
      matchedStatus: null,
      registryUrl: null,
    };
  }

  const url = new URL(OPEN_CORPORATES_SEARCH_URL);

  url.searchParams.set("q", published.legalName);
  url.searchParams.set("order", "score");
  url.searchParams.set("per_page", "5");
  url.searchParams.set("api_token", apiToken);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
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
      };
    }

    const payload = asRecord((await response.json()) as unknown);
    const results = payload ? asRecord(payload.results) : null;

    const companyEntries = results?.companies;

    const companies = Array.isArray(companyEntries)
      ? companyEntries
      : [];

    let best:
      | {
          company: Record<string, unknown>;
          score: number;
        }
      | null = null;

    for (const wrapperValue of companies) {
      const wrapper = asRecord(wrapperValue);
      const company = wrapper ? asRecord(wrapper.company) : null;

      if (!company) {
        continue;
      }

      const score = scoreRegistryMatch(published, company);

      if (best === null || score > best.score) {
        best = {
          company,
          score,
        };
      }
    }

    if (!best || best.score < 60) {
      return {
        registryStatus: "NO_MATCH",
        matchedLegalName: null,
        matchedCompanyNumber: null,
        matchedJurisdiction: null,
        matchedStatus: null,
        registryUrl: null,
      };
    }

    return {
      registryStatus: "MATCHED",
      matchedLegalName:
        typeof best.company.name === "string" ? best.company.name : null,
      matchedCompanyNumber:
        typeof best.company.company_number === "string"
          ? best.company.company_number
          : null,
      matchedJurisdiction:
        typeof best.company.jurisdiction_code === "string"
          ? best.company.jurisdiction_code.toUpperCase()
          : null,
      matchedStatus:
        typeof best.company.current_status === "string"
          ? best.company.current_status
          : null,
      registryUrl:
        typeof best.company.opencorporates_url === "string"
          ? best.company.opencorporates_url
          : null,
    };
  } catch {
    return {
      registryStatus: "UNAVAILABLE",
      matchedLegalName: null,
      matchedCompanyNumber: null,
      matchedJurisdiction: null,
      matchedStatus: null,
      registryUrl: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function inspectCompanyIdentity(
  input: CompanyIdentityInput,
): Promise<RawCompanyIntelligenceDto> {
  const published = selectPublishedIdentity(input);
  const registry = await queryOpenCorporates(published);

  return {
    publishedLegalName: published.legalName,
    publishedCompanyNumber: published.companyNumber,
    publishedVatNumber: published.vatNumber,
    publishedSourceUrl: published.sourceUrl,
    registryProvider: "OPEN_CORPORATES",
    ...registry,
  };
}
