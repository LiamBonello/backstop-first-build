import { randomUUID } from "node:crypto";
import * as cheerio from "cheerio";
import { getDomain } from "tldts";
import type {
  RawFindingDto,
  RawRiskFactorDto,
  RawScanResponseDto,
  RawSignalDto,
} from "../src/types/purchase";
import { fetchRenderedHtml } from "./browserFetch";
import { inspectCompanyIdentity } from "./companyIntelligence";
import { inspectDomain } from "./domainIntelligence";
import { fetchHtml, type FetchedHtml } from "./fetchHtml";
import { inspectThreatIntelligence } from "./threatIntelligence";

const MAIN_PAGE_MAX_BYTES = 10_000_000;
const RISK_BASELINE_POINTS = 16;

interface PolicyCandidate {
  kind: "returns" | "terms" | "shipping" | "warranty" | "cancellation";
  label: string;
  url: URL;
}

interface PolicyPage extends PolicyCandidate {
  text: string;
}

interface PriceData {
  amount: number | null;
  currency: string | null;
}

interface RenewalData {
  amount: number | null;
  interval: string | null;
  currency: string | null;
}

interface ParsedMainPage {
  $: cheerio.CheerioAPI;
  productHeading: string;
  mainText: string;
  productName: string;
  ogSiteName: string;
  applicationName: string;
  merchantName: string;
  price: PriceData;
  anchorCount: number;
}

const clamp = (value: number, min = 0, max = 100): number =>
  Math.min(max, Math.max(min, Math.round(value)));

const cleanText = (value: string | undefined | null): string =>
  (value ?? "").replace(/\s+/g, " ").trim();

const isSameSiteDomain = (candidate: URL, base: URL): boolean => {
  if (candidate.hostname === base.hostname) {
    return true;
  }

  const candidateDomain = getDomain(candidate.hostname);

  const baseDomain = getDomain(base.hostname);

  return (
    candidateDomain !== null &&
    baseDomain !== null &&
    candidateDomain === baseDomain
  );
};

const extractVisibleText = (html: string): string => {
  const $ = cheerio.load(html);

  $("script, style, noscript, svg, iframe, template").remove();

  return cleanText($("body").text()).slice(0, 150_000);
};

const titleCaseDomain = (hostname: string): string => {
  const base = hostname.replace(/^www\./, "").split(".")[0] ?? hostname;

  return base
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const parsePriceNumber = (raw: unknown): number | null => {
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw >= 0 ? raw : null;
  }

  if (typeof raw !== "string") {
    return null;
  }

  const cleaned = raw.replace(/[^\d.,-]/g, "").trim();

  if (!cleaned) {
    return null;
  }

  const commaIndex = cleaned.lastIndexOf(",");

  const dotIndex = cleaned.lastIndexOf(".");

  let normalized = cleaned;

  if (commaIndex >= 0 && dotIndex >= 0) {
    const decimalSeparator = commaIndex > dotIndex ? "," : ".";

    const thousandsSeparator = decimalSeparator === "," ? "." : ",";

    normalized = cleaned
      .split(thousandsSeparator)
      .join("")
      .replace(decimalSeparator, ".");
  } else if (commaIndex >= 0) {
    const decimalDigits = cleaned.length - commaIndex - 1;

    normalized =
      decimalDigits === 2
        ? cleaned.replace(",", ".")
        : cleaned.replace(/,/g, "");
  } else if (dotIndex >= 0) {
    const decimalDigits = cleaned.length - dotIndex - 1;

    normalized = decimalDigits === 2 ? cleaned : cleaned.replace(/\./g, "");
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const currencyFromSymbol = (symbol: string): string | null => {
  if (symbol === "€") return "EUR";
  if (symbol === "$") return "USD";
  if (symbol === "£") return "GBP";

  return null;
};

const normalizeCurrency = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const upper = value.trim().toUpperCase();

  return /^[A-Z]{3}$/.test(upper) ? upper : currencyFromSymbol(value.trim());
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const flattenJsonLd = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) {
    return value.flatMap(flattenJsonLd);
  }

  const record = asRecord(value);

  if (!record) return [];

  return [record, ...flattenJsonLd(record["@graph"])];
};

const getTypeValues = (value: unknown): string[] => {
  if (typeof value === "string") {
    return [value.toLowerCase()];
  }

  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.toLowerCase());
  }

  return [];
};

const getNamedValue = (value: unknown): string | null => {
  if (typeof value === "string") {
    return cleanText(value) || null;
  }

  const record = asRecord(value);

  if (record && typeof record.name === "string") {
    return cleanText(record.name) || null;
  }

  return null;
};

function parseJsonLd($: cheerio.CheerioAPI): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = [];

  $('script[type="application/ld+json"]').each((_index, element) => {
    const raw = $(element).text().trim();

    if (!raw) return;

    try {
      nodes.push(...flattenJsonLd(JSON.parse(raw) as unknown));
    } catch {
      // Invalid JSON-LD is common.
    }
  });

  return nodes;
}

function extractStructuredProduct(nodes: Record<string, unknown>[]): {
  productName: string | null;
  merchantName: string | null;
  price: PriceData;
} {
  const product = nodes.find((node) =>
    getTypeValues(node["@type"]).includes("product"),
  );

  if (!product) {
    return {
      productName: null,
      merchantName: null,
      price: {
        amount: null,
        currency: null,
      },
    };
  }

  const offersValue = product.offers;

  const offers = Array.isArray(offersValue)
    ? offersValue
        .map(asRecord)
        .filter((offer): offer is Record<string, unknown> => offer !== null)
    : [asRecord(offersValue)].filter(
        (offer): offer is Record<string, unknown> => offer !== null,
      );

  const offer = offers[0] ?? null;

  const amount = parsePriceNumber(
    offer?.price ?? offer?.lowPrice ?? product.price,
  );

  const currency = normalizeCurrency(
    offer?.priceCurrency ?? product.priceCurrency,
  );

  const merchantName =
    getNamedValue(product.brand) ??
    getNamedValue(offer?.seller) ??
    getNamedValue(product.manufacturer);

  return {
    productName: getNamedValue(product.name),
    merchantName,
    price: {
      amount,
      currency,
    },
  };
}

function extractMetaPrice($: cheerio.CheerioAPI): PriceData {
  const rawAmount =
    $('meta[property="product:price:amount"]').attr("content") ??
    $('[itemprop="price"]').first().attr("content") ??
    $('[itemprop="price"]').first().text();

  const rawCurrency =
    $('meta[property="product:price:currency"]').attr("content") ??
    $('[itemprop="priceCurrency"]').first().attr("content") ??
    $('[itemprop="priceCurrency"]').first().text();

  return {
    amount: parsePriceNumber(rawAmount),

    currency: normalizeCurrency(rawCurrency),
  };
}

function extractVisibleProductPrice(
  visibleText: string,
  productHeading: string,
): PriceData {
  if (!productHeading) {
    return {
      amount: null,
      currency: null,
    };
  }

  const textLower = visibleText.toLowerCase();

  const headingLower = productHeading.toLowerCase();

  const headingIndex = textLower.indexOf(headingLower);

  if (headingIndex < 0) {
    return {
      amount: null,
      currency: null,
    };
  }

  /*
   * Only inspect a small region immediately after
   * the actual product heading.
   *
   * This prevents shipping thresholds, related
   * products and footer amounts from being mistaken
   * for the product's own price.
   */
  const productRegion = visibleText.slice(
    headingIndex + productHeading.length,

    headingIndex + productHeading.length + 900,
  );

  const symbolPrice = productRegion.match(
    /(?:US|CA|AU|NZ)?\s*([€$£])\s*(\d{1,6}(?:[.,]\d{1,2})?)/i,
  );

  if (symbolPrice) {
    return {
      amount: parsePriceNumber(symbolPrice[2]),

      currency: currencyFromSymbol(symbolPrice[1]),
    };
  }

  const codePrice = productRegion.match(
    /(\d{1,6}(?:[.,]\d{1,2})?)\s*(EUR|USD|GBP)/i,
  );

  if (codePrice) {
    return {
      amount: parsePriceNumber(codePrice[1]),

      currency: normalizeCurrency(codePrice[2]),
    };
  }

  return {
    amount: null,
    currency: null,
  };
}

function discoverPolicies(
  $: cheerio.CheerioAPI,
  baseUrl: URL,
): PolicyCandidate[] {
  const patterns: Array<
    Pick<PolicyCandidate, "kind" | "label"> & {
      pattern: RegExp;
    }
  > = [
    {
      kind: "returns",
      label: "Return policy",
      pattern: /return|refund|withdrawal/i,
    },
    {
      kind: "terms",
      label: "Terms",
      pattern: /terms|conditions/i,
    },
    {
      kind: "shipping",
      label: "Shipping policy",
      pattern: /shipping|delivery/i,
    },
    {
      kind: "warranty",
      label: "Warranty",
      pattern: /warranty|guarantee/i,
    },
    {
      kind: "cancellation",
      label: "Cancellation policy",
      pattern: /cancel|subscription|membership/i,
    },
  ];

  const discovered = new Map<PolicyCandidate["kind"], PolicyCandidate>();

  $("a[href]").each((_index, element) => {
    const href = $(element).attr("href");

    if (!href) return;

    const anchorText = cleanText($(element).text());

    const combined = `${anchorText} ${href}`;

    const match = patterns.find(({ pattern }) => pattern.test(combined));

    if (!match || discovered.has(match.kind)) {
      return;
    }

    let url: URL;

    try {
      url = new URL(href, baseUrl);
    } catch {
      return;
    }

    if (
      !isSameSiteDomain(url, baseUrl) ||
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      (url.hostname === baseUrl.hostname && url.pathname === baseUrl.pathname)
    ) {
      return;
    }

    url.hash = "";

    discovered.set(match.kind, {
      kind: match.kind,
      label: match.label,
      url,
    });
  });

  return Array.from(discovered.values()).slice(0, 5);
}

async function fetchPolicyPages(
  candidates: PolicyCandidate[],
): Promise<PolicyPage[]> {
  const settled = await Promise.allSettled(
    candidates.map(async (candidate): Promise<PolicyPage> => {
      const page = await fetchHtml(candidate.url);

      return {
        ...candidate,
        url: page.finalUrl,
        text: extractVisibleText(page.html),
      };
    }),
  );

  return settled.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
}

function extractReturnWindowDays(text: string): number | null {
  const patterns = [
    /(?:return|refund|withdraw(?:al)?)[^.!?]{0,140}?within\s+(\d{1,3})\s+days?/gi,

    /within\s+(\d{1,3})\s+days?[^.!?]{0,140}?(?:return|refund|withdraw(?:al)?)/gi,

    /(?:return|refund)[^.!?]{0,140}?(\d{1,3})\s+days?/gi,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const days = Number(match[1]);

      if (days >= 1 && days <= 180) {
        return days;
      }
    }
  }

  return null;
}

function extractWarrantyMonths(text: string): number | null {
  const patterns = [
    /(\d{1,2})\s*(year|month)s?[^.!?]{0,100}warrant(?:y|ies)/gi,

    /warrant(?:y|ies)[^.!?]{0,100}?(\d{1,2})\s*(year|month)s?/gi,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);

    if (!match) continue;

    const value = Number(match[1]);

    if (!Number.isFinite(value) || value <= 0) {
      continue;
    }

    return match[2].toLowerCase().startsWith("year") ? value * 12 : value;
  }

  return null;
}

function extractRenewal(text: string): RenewalData {
  const recurringContext = text.match(
    /[^.!?]{0,140}(?:subscription|membership|auto[- ]?renew|recurring|renews automatically)[^.!?]{0,180}/i,
  )?.[0];

  if (!recurringContext) {
    return {
      amount: null,
      interval: null,
      currency: null,
    };
  }

  const symbolPrice = recurringContext.match(
    /([€$£])\s?(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:\/|per\s+)?(day|week|month|year|annual|monthly|yearly)?/i,
  );

  const codePrice = recurringContext.match(
    /(\d{1,6}(?:[.,]\d{1,2})?)\s*(EUR|USD|GBP)\s*(?:\/|per\s+)?(day|week|month|year|annual|monthly|yearly)?/i,
  );

  const amount = parsePriceNumber(symbolPrice?.[2] ?? codePrice?.[1]);

  const currency = symbolPrice
    ? currencyFromSymbol(symbolPrice[1])
    : normalizeCurrency(codePrice?.[2]);

  const rawInterval = symbolPrice?.[3] ?? codePrice?.[3] ?? null;

  const interval = rawInterval
    ? rawInterval
        .toLowerCase()
        .replace("monthly", "month")
        .replace("yearly", "year")
        .replace("annual", "year")
    : null;

  return {
    amount,
    interval,
    currency,
  };
}

function sourceFor(
  pages: PolicyPage[],
  kind: PolicyCandidate["kind"],
  fallback: URL,
): string {
  return (
    pages.find((page) => page.kind === kind)?.url.toString() ??
    fallback.toString()
  );
}

function createSignal(
  id: RawSignalDto["id"],
  label: string,
  scorePercent: number,
  statusLabel: string,
): RawSignalDto {
  return {
    id,
    label,
    scorePercent: clamp(scorePercent),
    statusLabel,
  };
}

function formatDomainAgeForFinding(days: number): string {
  if (days < 60) {
    return `${days} day${days === 1 ? "" : "s"}`;
  }

  if (days < 730) {
    const months = Math.max(1, Math.floor(days / 30));
    return `${months} month${months === 1 ? "" : "s"}`;
  }

  return `${(days / 365).toFixed(1)} years`;
}

function extractPaymentMethods(
  $: cheerio.CheerioAPI,
  visibleText: string,
): string[] {
  const attributeText: string[] = [];

  $("[alt], [aria-label], [title]").each((_index, element) => {
    const alt = $(element).attr("alt");

    const ariaLabel = $(element).attr("aria-label");

    const title = $(element).attr("title");

    attributeText.push(alt ?? "", ariaLabel ?? "", title ?? "");
  });

  const searchableText = [visibleText, ...attributeText]
    .join(" ")
    .toLowerCase();

  const paymentMethods = [
    {
      label: "PayPal",
      patterns: ["paypal"],
    },
    {
      label: "Visa",
      patterns: ["visa"],
    },
    {
      label: "Mastercard",
      patterns: ["mastercard", "master card"],
    },
    {
      label: "American Express",

      patterns: ["american express", "amex"],
    },
    {
      label: "Apple Pay",

      patterns: ["apple pay", "applepay"],
    },
    {
      label: "Google Pay",

      patterns: ["google pay", "googlepay"],
    },
    {
      label: "Klarna",

      patterns: ["klarna"],
    },
    {
      label: "Shop Pay",

      patterns: ["shop pay", "shoppay"],
    },
  ];

  return paymentMethods
    .filter((method) =>
      method.patterns.some((pattern) => searchableText.includes(pattern)),
    )
    .map((method) => method.label);
}

function parseMainPage(page: FetchedHtml): ParsedMainPage {
  const $ = cheerio.load(page.html);
  const jsonLd = parseJsonLd($);
  const structuredProduct = extractStructuredProduct(jsonLd);
  const metaPrice = extractMetaPrice($);
  const productHeading = cleanText($("h1").first().text());
  const mainText = extractVisibleText(page.html);

  const visibleProductPrice = extractVisibleProductPrice(
    mainText,
    productHeading,
  );

  const productName =
    structuredProduct.productName ||
    productHeading ||
    cleanText($('meta[property="og:title"]').attr("content")) ||
    cleanText($("title").text()) ||
    "Product or offer";

  const ogSiteName = cleanText(
    $('meta[property="og:site_name"]').attr("content"),
  );

  const applicationName = cleanText(
    $('meta[name="application-name"]').attr("content"),
  );

  const merchantName =
    structuredProduct.merchantName ||
    ogSiteName ||
    applicationName ||
    titleCaseDomain(page.finalUrl.hostname);

  const price =
    structuredProduct.price.amount !== null
      ? structuredProduct.price
      : metaPrice.amount !== null
        ? metaPrice
        : visibleProductPrice;

  return {
    $,
    productHeading,
    mainText,
    productName,
    ogSiteName,
    applicationName,
    merchantName,
    price,
    anchorCount: $("a[href]").length,
  };
}

function shouldUseBrowserFallback(parsed: ParsedMainPage): boolean {
  const javascriptGate =
    /enable javascript|javascript (?:is )?required|requires javascript|turn on javascript/i.test(
      parsed.mainText,
    );

  const sparsePage =
    parsed.mainText.length < 350 &&
    parsed.productHeading.length === 0;

  return (
    parsed.productName === "Product or offer" ||
    parsed.price.amount === null ||
    javascriptGate ||
    sparsePage
  );
}

function mainPageEvidenceScore(parsed: ParsedMainPage): number {
  let score = 0;

  if (parsed.productName !== "Product or offer") {
    score += 4;
  }

  if (parsed.price.amount !== null) {
    score += 5;
  }

  if (parsed.productHeading) {
    score += 2;
  }

  if (parsed.mainText.length >= 1_000) {
    score += 2;
  } else if (parsed.mainText.length >= 300) {
    score += 1;
  }

  if (parsed.anchorCount >= 5) {
    score += 1;
  }

  return score;
}

export async function analyzeUrl(
  inputUrl: string,
): Promise<RawScanResponseDto> {
  let page = await fetchHtml(inputUrl, {
    maxBytes: MAIN_PAGE_MAX_BYTES,
  });

  let parsed = parseMainPage(page);
  let scanMethod: RawScanResponseDto["scanMethod"] = "STATIC_HTML";

  if (shouldUseBrowserFallback(parsed)) {
    const renderedPage = await fetchRenderedHtml(page.finalUrl);

    if (renderedPage) {
      const renderedParsed = parseMainPage(renderedPage);

      if (
        mainPageEvidenceScore(renderedParsed) >=
        mainPageEvidenceScore(parsed)
      ) {
        page = renderedPage;
        parsed = renderedParsed;
        scanMethod = "BROWSER_RENDERED";
      }
    }
  }

  const {
    $,
    productName,
    ogSiteName,
    applicationName,
    merchantName,
    price,
    mainText,
  } = parsed;

  const policyCandidates = discoverPolicies($, page.finalUrl);

  const [policyPages, domainIntelligence, threatIntelligence] =
    await Promise.all([
      fetchPolicyPages(policyCandidates),
      inspectDomain(page.finalUrl),
      inspectThreatIntelligence(page.finalUrl),
    ]);

  const companyIntelligence = await inspectCompanyIdentity({
    merchantName,
    mainPageText: mainText,
    mainPageUrl: page.finalUrl.toString(),
    policyPages: policyPages.map((policy) => ({
      label: policy.label,
      text: policy.text,
      url: policy.url.toString(),
    })),
  });

  const policyText = policyPages.map((policy) => policy.text).join(" ");

  const combinedText = `${mainText} ${policyText}`;

  const returnPolicy = policyPages.find((policy) => policy.kind === "returns");

  const termsPolicy = policyPages.find((policy) => policy.kind === "terms");

  const cancellationPolicy = policyPages.find(
    (policy) => policy.kind === "cancellation",
  );

  const returnText = `${returnPolicy?.text ?? ""} ${policyText}`;

  const commitmentText = `${termsPolicy?.text ?? ""} ${
    cancellationPolicy?.text ?? ""
  } ${mainText}`;

  const returnWindowDays = extractReturnWindowDays(returnText);

  const warrantyMonths = extractWarrantyMonths(combinedText);

  const renewal = extractRenewal(commitmentText);

  const recurringDetected =
    /\b(subscription|membership|recurring|auto[- ]?renew|renews automatically|automatic renewal)\b/i.test(
      commitmentText,
    );

  const returnShippingPaidByCustomer =
    /(customer|buyer|you)[^.!?]{0,80}(responsible|pay|cover)[^.!?]{0,80}return shipping/i.test(
      returnText,
    ) ||
    /return shipping[^.!?]{0,80}(at your expense|non-refundable|not refunded)/i.test(
      returnText,
    );

  const internationalReturn =
    /return[^.!?]{0,120}(international|overseas|outside the (?:eu|european union)|china|hong kong)/i.test(
      returnText,
    );

  const discountLanguageDetected =
    /\b\d{1,2}%\s*off\b|\bsave\s+[€$£]|\bcompare at\b|\bsale price\b|\bwas\s+[€$£]/i.test(
      mainText,
    );

  const mainstreamPayments = extractPaymentMethods($, mainText);

  const hasContactRoute =
    $('a[href^="mailto:"]').length > 0 ||
    $('a[href^="tel:"]').length > 0 ||
    $("a[href]")
      .toArray()
      .some((element) => {
        const text = `${$(element).text()} ${$(element).attr("href") ?? ""}`;

        return /contact|support|customer service/i.test(text);
      });

  const hasReturnsPolicy = Boolean(
    returnPolicy ||
    policyCandidates.some((candidate) => candidate.kind === "returns"),
  );

  const hasTermsPolicy = Boolean(
    termsPolicy ||
    policyCandidates.some((candidate) => candidate.kind === "terms"),
  );

  const https = page.finalUrl.protocol === "https:";

  const riskFactors: RawRiskFactorDto[] = [];
  let rawRisk = RISK_BASELINE_POINTS;

  const applyRiskFactor = (
    condition: boolean,
    factor: RawRiskFactorDto,
  ): void => {
    if (!condition) {
      return;
    }

    riskFactors.push(factor);
    rawRisk += factor.impactPoints;
  };

  if (
    domainIntelligence.domainAgeDays !== null &&
    domainIntelligence.domainAgeDays < 30
  ) {
    applyRiskFactor(true, {
      id: "domain_very_new",
      label: "Very recent domain registration",
      detail:
        "RDAP indicates the registrable domain was created less than 30 days ago. New domains can be legitimate, but they provide less operating history.",
      impactPoints: 20,
    });
  } else {
    applyRiskFactor(
      domainIntelligence.domainAgeDays !== null &&
        domainIntelligence.domainAgeDays < 180,
      {
        id: "domain_recent",
        label: "Recent domain registration",
        detail:
          "RDAP indicates the registrable domain is less than 180 days old, so there is limited domain history to assess.",
        impactPoints: 10,
      },
    );
  }

  applyRiskFactor(domainIntelligence.tlsAuthorized === false, {
    id: "tls_validation",
    label: "TLS certificate validation issue",
    detail:
      "The HTTPS certificate did not validate successfully during Backstop's independent TLS check.",
    impactPoints: 18,
  });

  applyRiskFactor(threatIntelligence.status === "FLAGGED", {
    id: "threat_match",
    label: "Threat-intelligence match",
    detail:
      "Google Web Risk returned a malware, social-engineering or unwanted-software match for this URL.",
    impactPoints: 55,
  });

  applyRiskFactor(recurringDetected, {
    id: "recurring_commitment",
    label: "Recurring commitment language",
    detail:
      "Subscription, membership or automatic-renewal language was detected in the inspected pages.",
    impactPoints: 29,
  });

  applyRiskFactor(!hasReturnsPolicy, {
    id: "returns_missing",
    label: "Return policy not located",
    detail:
      "Backstop could not locate a clearly labelled return or refund policy from the product page.",
    impactPoints: 14,
  });

  applyRiskFactor(returnShippingPaidByCustomer, {
    id: "return_shipping_cost",
    label: "Customer-paid return shipping",
    detail:
      "The return policy indicates that the customer may need to pay return-shipping costs.",
    impactPoints: 12,
  });

  applyRiskFactor(internationalReturn, {
    id: "international_return",
    label: "International return route",
    detail:
      "The return language suggests that a refund may require an international or overseas return.",
    impactPoints: 10,
  });

  applyRiskFactor(returnWindowDays !== null && returnWindowDays < 14, {
    id: "short_return_window",
    label: "Short return window",
    detail:
      "The detected return window is shorter than 14 days.",
    impactPoints: 10,
  });

  applyRiskFactor(discountLanguageDetected, {
    id: "discount_unverified",
    label: "Discount not independently verified",
    detail:
      "The page uses sale or discount language, but Backstop does not yet have independent historical-price data to verify the claimed saving.",
    impactPoints: 8,
  });

  applyRiskFactor(mainstreamPayments.length === 0, {
    id: "payment_visibility",
    label: "Payment protection not confirmed",
    detail:
      "No mainstream payment method was reliably detected on the inspected public page.",
    impactPoints: 7,
  });

  applyRiskFactor(!hasContactRoute, {
    id: "contact_route",
    label: "Merchant contact route not obvious",
    detail:
      "The inspected page did not expose an obvious support, email, telephone or customer-service route.",
    impactPoints: 7,
  });

  applyRiskFactor(!https, {
    id: "https_missing",
    label: "HTTPS not in use",
    detail:
      "The final merchant page did not use HTTPS.",
    impactPoints: 12,
  });

  applyRiskFactor(price.amount === null, {
    id: "price_missing",
    label: "Product price not reliably extracted",
    detail:
      "Backstop could not reliably extract the product price from the inspected page.",
    impactPoints: 5,
  });

  applyRiskFactor(returnWindowDays !== null && returnWindowDays >= 30, {
    id: "return_window_30_plus",
    label: "30+ day return window",
    detail:
      "A return window of at least 30 days was detected, which reduces transaction friction.",
    impactPoints: -4,
  });

  const risk = clamp(rawRisk);

  let evidenceCoverage = 0;

  if (productName !== "Product or offer") {
    evidenceCoverage += 10;
  }

  if (price.amount !== null) {
    evidenceCoverage += 14;
  }

  if (ogSiteName || applicationName || structuredProduct.merchantName) {
    evidenceCoverage += 8;
  }

  if (policyPages.length > 0) {
    evidenceCoverage += 8;
  }

  if (returnWindowDays !== null) {
    evidenceCoverage += 8;
  }

  if (hasTermsPolicy) {
    evidenceCoverage += 7;
  }

  if (mainstreamPayments.length > 0) {
    evidenceCoverage += 7;
  }

  if (hasContactRoute) {
    evidenceCoverage += 6;
  }

  if (domainIntelligence.registrationDateIso !== null) {
    evidenceCoverage += 14;
  }

  if (domainIntelligence.registrarName !== null) {
    evidenceCoverage += 5;
  }

  if (domainIntelligence.nameserverCount !== null) {
    evidenceCoverage += 5;
  }

  if (domainIntelligence.tlsReachable) {
    evidenceCoverage += 8;
  }

  evidenceCoverage = clamp(evidenceCoverage);

  const domainAgeIdentityAdjustment =
    domainIntelligence.domainAgeDays === null
      ? 0
      : domainIntelligence.domainAgeDays < 30
        ? -15
        : domainIntelligence.domainAgeDays < 180
          ? -5
          : domainIntelligence.domainAgeDays >= 365
            ? 10
            : 5;

  const identityScore = clamp(
    25 +
      (https ? 15 : 0) +
      (hasContactRoute ? 15 : 0) +
      (ogSiteName || applicationName || structuredProduct.merchantName ? 10 : 0) +
      (domainIntelligence.registrationDateIso !== null ? 10 : 0) +
      (domainIntelligence.registrarName !== null ? 5 : 0) +
      (domainIntelligence.nameserverCount !== null &&
      domainIntelligence.nameserverCount > 0
        ? 5
        : 0) +
      (domainIntelligence.tlsAuthorized === true ? 15 : 0) +
      (companyIntelligence.publishedLegalName !== null ? 5 : 0) +
      (companyIntelligence.registryStatus === "MATCHED" ? 10 : 0) +
      domainAgeIdentityAdjustment,
  );

  const pricingScore = clamp(
    (price.amount !== null ? 78 : 38) - (discountLanguageDetected ? 23 : 0),
  );

  const returnsScore = clamp(
    (hasReturnsPolicy ? 68 : 30) +
      (returnWindowDays !== null ? 12 : 0) -
      (returnShippingPaidByCustomer ? 22 : 0) -
      (internationalReturn ? 12 : 0),
  );

  const commitmentScore = recurringDetected ? 24 : 88;

  const protectionScore = mainstreamPayments.length > 0 ? 82 : 44;

  const signals: RawSignalDto[] = [
    createSignal(
      "identity",
      "Identity",
      identityScore,
      companyIntelligence.registryStatus === "MATCHED"
        ? "Registry matched"
        : identityScore >= 75
          ? "Strong"
          : identityScore >= 55
            ? "Partial"
            : "Limited",
    ),

    createSignal(
      "pricing",
      "Pricing",
      pricingScore,
      price.amount === null
        ? "Unclear"
        : discountLanguageDetected
          ? "Verify discount"
          : "Clear",
    ),

    createSignal(
      "returns",
      "Returns",
      returnsScore,
      !hasReturnsPolicy
        ? "Unclear"
        : returnShippingPaidByCustomer || internationalReturn
          ? "Friction"
          : returnWindowDays !== null
            ? `${returnWindowDays} days`
            : "Visible",
    ),

    createSignal(
      "commitment",
      "Commitment",
      commitmentScore,
      recurringDetected ? "Recurring risk" : "No recurring signal",
    ),

    createSignal(
      "protection",
      "Protection",
      protectionScore,
      mainstreamPayments.length > 0
        ? `${mainstreamPayments.length} methods found`
        : "Limited visibility",
    ),
  ];

  const findings: RawFindingDto[] = [];

  if (recurringDetected) {
    findings.push({
      id: "finding_commitment",
      category: "Commitment",

      headline:
        renewal.amount !== null
          ? "Recurring payment language detected"
          : "Recurring commitment language detected",

      detail:
        renewal.amount !== null
          ? `Backstop found recurring-payment language near a ${renewal.amount.toFixed(2)}${
              renewal.interval ? ` per ${renewal.interval}` : ""
            } charge. Confirm the exact trigger and cancellation route before paying.`
          : "Backstop found subscription, membership or automatic-renewal language in the pages inspected. Confirm the exact trigger, price and cancellation route before paying.",

      sourceLabel:
        cancellationPolicy?.label ?? termsPolicy?.label ?? "Page terms",

      sourceUrl: sourceFor(
        policyPages,
        cancellationPolicy ? "cancellation" : "terms",
        page.finalUrl,
      ),

      severityCode: "HIGH",
    });
  } else {
    findings.push({
      id: "finding_commitment",

      category: "Commitment",

      headline: "No recurring commitment language found",

      detail:
        "Backstop did not find obvious subscription, membership or automatic-renewal language in the public pages it inspected. This is evidence, not a guarantee that checkout cannot add one later.",

      sourceLabel: hasTermsPolicy
        ? "Terms inspected"
        : "Public pages inspected",

      sourceUrl: termsPolicy?.url.toString() ?? page.finalUrl.toString(),

      severityCode: "GOOD",
    });
  }

  if (!hasReturnsPolicy) {
    findings.push({
      id: "finding_returns",

      category: "Returns",

      headline: "Return policy could not be located",

      detail:
        "Backstop could not find a clearly labelled return or refund policy from the product page. Before paying, verify whether returns are accepted, the time limit, and who pays the return cost.",

      sourceLabel: "Policy discovery",

      sourceUrl: page.finalUrl.toString(),

      severityCode: "MEDIUM",
    });
  } else if (returnShippingPaidByCustomer || internationalReturn) {
    findings.push({
      id: "finding_returns",

      category: "Returns",

      headline: internationalReturn
        ? "Return route may involve international shipping"
        : "Customer-paid return shipping detected",

      detail: `${
        returnWindowDays !== null
          ? `A ${returnWindowDays}-day return window was detected. `
          : ""
      }The policy also indicates return-shipping friction that could materially reduce the practical value of a refund.`,

      sourceLabel: returnPolicy?.label ?? "Return policy",

      sourceUrl: returnPolicy?.url.toString() ?? page.finalUrl.toString(),

      severityCode: "MEDIUM",
    });
  } else {
    findings.push({
      id: "finding_returns",

      category: "Returns",

      headline:
        returnWindowDays !== null
          ? `${returnWindowDays}-day return window detected`
          : "Return policy located",

      detail:
        returnWindowDays !== null
          ? `Backstop located return/refund language indicating a ${returnWindowDays}-day window. The actual deadline will depend on the policy trigger, such as purchase or delivery date.`
          : "A return/refund policy was located, but Backstop could not reliably extract a single return-window duration from the text.",

      sourceLabel: returnPolicy?.label ?? "Return policy",

      sourceUrl: returnPolicy?.url.toString() ?? page.finalUrl.toString(),

      severityCode: "GOOD",
    });
  }

  findings.push({
    id: "finding_pricing",

    category: "Pricing",

    headline:
      price.amount === null
        ? "Price could not be reliably extracted"
        : discountLanguageDetected
          ? "Discount language detected; price history not verified"
          : "Current displayed price was extracted",

    detail:
      price.amount === null
        ? scanMethod === "BROWSER_RENDERED"
          ? "Backstop rendered the page in Chromium but still could not extract a reliable product price. The price may only appear after user interaction, location selection or checkout."
          : "The page structure did not expose a reliable product price to the static scanner, and a usable browser-rendered result was not available for this scan."
        : discountLanguageDetected
          ? "The page contains sale or discount language. This build can read the current offer, but it does not yet have an independent historical-price dataset to verify the claimed saving."
          : "Backstop extracted the current offer price from structured product data or page metadata. Independent historical-price verification will be added separately.",

    sourceLabel: "Product page",

    sourceUrl: page.finalUrl.toString(),

    severityCode: discountLanguageDetected
      ? "MEDIUM"
      : price.amount === null
        ? "INFO"
        : "GOOD",
  });

  findings.push({
    id: "finding_payment",

    category: "Payment",

    headline:
      mainstreamPayments.length > 0
        ? "Mainstream payment methods detected"
        : "Payment methods could not be confirmed from this page",

    detail:
      mainstreamPayments.length > 0
        ? `Backstop found references to ${mainstreamPayments
            .slice(0, 5)
            .join(
              ", ",
            )}. Depending on the provider and transaction, those methods may provide additional dispute routes.`
        : "No mainstream protected payment method was reliably detected in the public page text. The checkout may still expose options that are not visible until later.",

    sourceLabel: "Page payment signals",

    sourceUrl: page.finalUrl.toString(),

    severityCode: mainstreamPayments.length > 0 ? "GOOD" : "INFO",
  });

  findings.push({
    id: "finding_identity",

    category: "Identity",

    headline: hasContactRoute
      ? "Merchant contact route detected"
      : "Merchant contact route was not obvious",

    detail: hasContactRoute
      ? "The inspected page exposes a contact, support, email or telephone route. Backstop also checks domain registration, DNS, TLS and, where a legal entity can be extracted, a GLEIF LEI lookup."
      : "Backstop did not find an obvious contact, support, email or telephone route on the inspected page. Domain registration, DNS, TLS and eligible GLEIF LEI lookups are checked independently.",

    sourceLabel: "Merchant page",

    sourceUrl: page.finalUrl.toString(),

    severityCode: hasContactRoute ? "GOOD" : "MEDIUM",
  });

  const domainAge = domainIntelligence.domainAgeDays;

  const domainSeverity: RawFindingDto["severityCode"] =
    domainIntelligence.tlsAuthorized === false ||
    (domainAge !== null && domainAge < 30)
      ? "HIGH"
      : domainAge !== null && domainAge < 180
        ? "MEDIUM"
        : domainAge !== null
          ? "GOOD"
          : "INFO";

  const domainHeadline =
    domainIntelligence.tlsAuthorized === false
      ? "TLS certificate validation issue detected"
      : domainAge !== null && domainAge < 30
        ? `Domain registered only ${formatDomainAgeForFinding(domainAge)} ago`
        : domainAge !== null && domainAge < 180
          ? "Relatively recent domain registration"
          : domainAge !== null
            ? `Domain registration dates back ${formatDomainAgeForFinding(domainAge)}`
            : "Independent registration date could not be retrieved";

  const domainDetailParts: string[] = [];

  if (domainIntelligence.registrarName) {
    domainDetailParts.push(
      `RDAP identifies the registrar as ${domainIntelligence.registrarName}.`,
    );
  }

  if (domainIntelligence.nameserverCount !== null) {
    domainDetailParts.push(
      `DNS exposes ${domainIntelligence.nameserverCount} nameserver${domainIntelligence.nameserverCount === 1 ? "" : "s"}.`,
    );
  }

  if (domainIntelligence.tlsAuthorized === true) {
    domainDetailParts.push("The TLS certificate validated successfully.");
  } else if (domainIntelligence.tlsAuthorized === false) {
    domainDetailParts.push("The TLS certificate did not validate successfully.");
  }

  domainDetailParts.push(
    "Domain age and infrastructure are identity signals, not proof that a merchant is trustworthy.",
  );

  findings.push({
    id: "finding_domain",
    category: "Domain",
    headline: domainHeadline,
    detail: domainDetailParts.join(" "),
    sourceLabel: "RDAP / DNS / TLS",
    sourceUrl: domainIntelligence.rdapSourceUrl,
    severityCode: domainSeverity,
  });

  if (threatIntelligence.status === "FLAGGED") {
    findings.push({
      id: "finding_threat",
      category: "Threat",
      headline: "Configured threat intelligence returned a match",
      detail: `Google Web Risk returned the following threat type${threatIntelligence.threatTypes.length === 1 ? "" : "s"}: ${threatIntelligence.threatTypes.join(", ") || "unspecified"}. Treat this as a high-priority security signal.`,
      sourceLabel: "Google Web Risk",
      sourceUrl: null,
      severityCode: "HIGH",
    });
  } else if (threatIntelligence.status === "CLEAR") {
    findings.push({
      id: "finding_threat",
      category: "Threat",
      headline: "No threat-list match found",
      detail:
        "Google Web Risk returned no match for malware, social-engineering or unwanted-software lists. This does not prove that the merchant or transaction is safe.",
      sourceLabel: "Google Web Risk",
      sourceUrl: null,
      severityCode: "GOOD",
    });
  }

  if (
    companyIntelligence.registryStatus === "MATCHED" &&
    companyIntelligence.matchedLegalName
  ) {
    findings.push({
      id: "finding_company",
      category: "Identity",
      headline: "Published legal entity matched an external registry result",
      detail: `The merchant pages identify ${companyIntelligence.publishedLegalName ?? "a legal entity"}, and GLEIF returned a close LEI record match for ${companyIntelligence.matchedLegalName}.`,
      sourceLabel: "Company identity",
      sourceUrl:
        companyIntelligence.registryUrl ??
        companyIntelligence.publishedSourceUrl,
      severityCode: "GOOD",
    });
  } else if (companyIntelligence.registryStatus === "NO_MATCH") {
    findings.push({
      id: "finding_company",
      category: "Identity",
      headline: "Published legal entity found; no LEI record matched",
      detail:
        "Backstop extracted a legal entity from the merchant's own pages, but GLEIF did not return a sufficiently close LEI record. Many legitimate businesses do not have an LEI, so this is informational only and is not treated as a negative trust signal.",
      sourceLabel: "Company identity",
      sourceUrl: companyIntelligence.publishedSourceUrl,
      severityCode: "INFO",
    });
  }

  const currency =
    price.currency ?? (price.amount === null ? renewal.currency : null);

  const estimatedMoneyAtRisk =
    price.amount !== null
      ? price.amount +
        (recurringDetected && renewal.amount !== null ? renewal.amount : 0)
      : null;

  const verdict =
    risk >= 75
      ? "High-friction signals"
      : risk >= 55
        ? "Proceed carefully"
        : risk >= 32
          ? "Review the details"
          : "Lower-friction profile";

  return {
    scanId: `scan_${randomUUID()}`,

    scanMethod,

    merchantName,

    merchantDomain: page.finalUrl.hostname.replace(/^www\./, ""),

    productName,

    currency,

    amount: price.amount,

    evidenceCoveragePercent: evidenceCoverage,

    riskPercent: risk,

    riskBreakdown: {
      baselinePoints: RISK_BASELINE_POINTS,
      uncappedPoints: rawRisk,
      factors: riskFactors,
    },

    verdict,

    scannedAtIso: new Date().toISOString(),

    signals,

    findings,

    domainIntelligence,

    externalIntelligence: {
      threat: threatIntelligence,
      company: companyIntelligence,
    },

    protection: {
      returnWindowDays,
      warrantyMonths,

      renewalAmount: recurringDetected ? renewal.amount : null,

      renewalIntervalLabel: recurringDetected ? renewal.interval : null,

      estimatedMoneyAtRisk,
    },
  };
}
