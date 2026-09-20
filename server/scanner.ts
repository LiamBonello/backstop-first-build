import { randomUUID } from 'node:crypto';
import * as cheerio from 'cheerio';
import type {
  RawFindingDto,
  RawScanResponseDto,
  RawSignalDto,
} from '../src/types/purchase';
import { fetchHtml } from './fetchHtml';

interface PolicyCandidate {
  kind:
    | 'returns'
    | 'terms'
    | 'shipping'
    | 'warranty'
    | 'cancellation';
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

const clamp = (
  value: number,
  min = 0,
  max = 100,
): number =>
  Math.min(max, Math.max(min, Math.round(value)));

const cleanText = (
  value: string | undefined | null,
): string =>
  (value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

const extractVisibleText = (
  html: string,
): string => {
  const $ = cheerio.load(html);

  $(
    'script, style, noscript, svg, iframe, template',
  ).remove();

  return cleanText(
    $('body').text(),
  ).slice(0, 150_000);
};

const titleCaseDomain = (
  hostname: string,
): string => {
  const base =
    hostname
      .replace(/^www\./, '')
      .split('.')[0] ?? hostname;

  return base
    .split(/[-_]/)
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(' ');
};

const parsePriceNumber = (
  raw: string | number | null | undefined,
): number | null => {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null;
  }

  if (!raw) return null;

  const cleaned = String(raw)
    .replace(/[^\d.,-]/g, '')
    .trim();

  if (!cleaned) return null;

  const commaIndex =
    cleaned.lastIndexOf(',');

  const dotIndex =
    cleaned.lastIndexOf('.');

  let normalized = cleaned;

  if (
    commaIndex >= 0 &&
    dotIndex >= 0
  ) {
    const decimalSeparator =
      commaIndex > dotIndex ? ',' : '.';

    const thousandsSeparator =
      decimalSeparator === ','
        ? '.'
        : ',';

    normalized = cleaned
      .split(thousandsSeparator)
      .join('')
      .replace(decimalSeparator, '.');
  } else if (commaIndex >= 0) {
    const decimalDigits =
      cleaned.length -
      commaIndex -
      1;

    normalized =
      decimalDigits === 2
        ? cleaned.replace(',', '.')
        : cleaned.replace(/,/g, '');
  } else if (dotIndex >= 0) {
    const decimalDigits =
      cleaned.length -
      dotIndex -
      1;

    normalized =
      decimalDigits === 2
        ? cleaned
        : cleaned.replace(/\./g, '');
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) &&
    parsed >= 0
    ? parsed
    : null;
};

const currencyFromSymbol = (
  symbol: string,
): string | null => {
  if (symbol === '€') return 'EUR';
  if (symbol === '$') return 'USD';
  if (symbol === '£') return 'GBP';

  return null;
};

const normalizeCurrency = (
  value: unknown,
): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const upper =
    value
      .trim()
      .toUpperCase();

  return /^[A-Z]{3}$/.test(upper)
    ? upper
    : currencyFromSymbol(
        value.trim(),
      );
};

const asRecord = (
  value: unknown,
): Record<string, unknown> | null =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value)
    ? (value as Record<
        string,
        unknown
      >)
    : null;

const flattenJsonLd = (
  value: unknown,
): Record<string, unknown>[] => {
  if (Array.isArray(value)) {
    return value.flatMap(
      flattenJsonLd,
    );
  }

  const record = asRecord(value);

  if (!record) return [];

  return [
    record,
    ...flattenJsonLd(
      record['@graph'],
    ),
  ];
};

const getTypeValues = (
  value: unknown,
): string[] => {
  if (typeof value === 'string') {
    return [value.toLowerCase()];
  }

  if (Array.isArray(value)) {
    return value
      .filter(
        (
          item,
        ): item is string =>
          typeof item === 'string',
      )
      .map((item) =>
        item.toLowerCase(),
      );
  }

  return [];
};

const getNamedValue = (
  value: unknown,
): string | null => {
  if (typeof value === 'string') {
    return cleanText(value) || null;
  }

  const record = asRecord(value);

  if (
    record &&
    typeof record.name === 'string'
  ) {
    return (
      cleanText(record.name) ||
      null
    );
  }

  return null;
};

function parseJsonLd(
  $: cheerio.CheerioAPI,
): Record<string, unknown>[] {
  const nodes: Record<
    string,
    unknown
  >[] = [];

  $(
    'script[type="application/ld+json"]',
  ).each(
    (
      _index,
      element,
    ) => {
      const raw = $(element)
        .text()
        .trim();

      if (!raw) return;

      try {
        nodes.push(
          ...flattenJsonLd(
            JSON.parse(
              raw,
            ) as unknown,
          ),
        );
      } catch {
        // Invalid JSON-LD is common.
      }
    },
  );

  return nodes;
}

function extractStructuredProduct(
  nodes: Record<
    string,
    unknown
  >[],
): {
  productName: string | null;
  merchantName: string | null;
  price: PriceData;
} {
  const product = nodes.find(
    (node) =>
      getTypeValues(
        node['@type'],
      ).includes('product'),
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

  const offersValue =
    product.offers;

  const offers =
    Array.isArray(offersValue)
      ? offersValue
          .map(asRecord)
          .filter(
            (
              offer,
            ): offer is Record<
              string,
              unknown
            > =>
              offer !== null,
          )
      : [
          asRecord(
            offersValue,
          ),
        ].filter(
          (
            offer,
          ): offer is Record<
            string,
            unknown
          > =>
            offer !== null,
        );

  const offer =
    offers[0] ?? null;

  const amount =
    parsePriceNumber(
      offer?.price ??
        offer?.lowPrice ??
        product.price,
    );

  const currency =
    normalizeCurrency(
      offer?.priceCurrency ??
        product.priceCurrency,
    );

  const merchantName =
    getNamedValue(
      product.brand,
    ) ??
    getNamedValue(
      offer?.seller,
    ) ??
    getNamedValue(
      product.manufacturer,
    );

  return {
    productName:
      getNamedValue(
        product.name,
      ),
    merchantName,
    price: {
      amount,
      currency,
    },
  };
}

function extractMetaPrice(
  $: cheerio.CheerioAPI,
): PriceData {
  const rawAmount =
    $(
      'meta[property="product:price:amount"]',
    ).attr('content') ??
    $('[itemprop="price"]')
      .first()
      .attr('content') ??
    $('[itemprop="price"]')
      .first()
      .text();

  const rawCurrency =
    $(
      'meta[property="product:price:currency"]',
    ).attr('content') ??
    $('[itemprop="priceCurrency"]')
      .first()
      .attr('content') ??
    $('[itemprop="priceCurrency"]')
      .first()
      .text();

  const amount =
    parsePriceNumber(
      rawAmount,
    );

  const currency =
    normalizeCurrency(
      rawCurrency,
    );

  if (amount !== null) {
    return {
      amount,
      currency,
    };
  }

  const bodySample =
    cleanText(
      $('body').text(),
    ).slice(0, 40_000);

  const symbolMatch =
    bodySample.match(
      /([€$£])\s?(\d{1,6}(?:[.,]\d{2})?)/,
    );

  if (!symbolMatch) {
    return {
      amount: null,
      currency: null,
    };
  }

  return {
    amount:
      parsePriceNumber(
        symbolMatch[2],
      ),
    currency:
      currencyFromSymbol(
        symbolMatch[1],
      ),
  };
}

function discoverPolicies(
  $: cheerio.CheerioAPI,
  baseUrl: URL,
): PolicyCandidate[] {
  const patterns: Array<
    Pick<
      PolicyCandidate,
      'kind' | 'label'
    > & {
      pattern: RegExp;
    }
  > = [
    {
      kind: 'returns',
      label: 'Return policy',
      pattern:
        /return|refund|withdrawal/i,
    },
    {
      kind: 'terms',
      label: 'Terms',
      pattern:
        /terms|conditions/i,
    },
    {
      kind: 'shipping',
      label:
        'Shipping policy',
      pattern:
        /shipping|delivery/i,
    },
    {
      kind: 'warranty',
      label: 'Warranty',
      pattern:
        /warranty|guarantee/i,
    },
    {
      kind:
        'cancellation',
      label:
        'Cancellation policy',
      pattern:
        /cancel|subscription|membership/i,
    },
  ];

  const discovered =
    new Map<
      PolicyCandidate['kind'],
      PolicyCandidate
    >();

  $('a[href]').each(
    (
      _index,
      element,
    ) => {
      const href =
        $(element).attr(
          'href',
        );

      if (!href) return;

      const anchorText =
        cleanText(
          $(element).text(),
        );

      const combined =
        `${anchorText} ${href}`;

      const match =
        patterns.find(
          ({ pattern }) =>
            pattern.test(
              combined,
            ),
        );

      if (
        !match ||
        discovered.has(
          match.kind,
        )
      ) {
        return;
      }

      let url: URL;

      try {
        url = new URL(
          href,
          baseUrl,
        );
      } catch {
        return;
      }

      if (
        url.origin !==
          baseUrl.origin ||
        (
          url.protocol !==
            'http:' &&
          url.protocol !==
            'https:'
        ) ||
        url.pathname ===
          baseUrl.pathname
      ) {
        return;
      }

      url.hash = '';

      discovered.set(
        match.kind,
        {
          kind: match.kind,
          label:
            match.label,
          url,
        },
      );
    },
  );

  return Array.from(
    discovered.values(),
  ).slice(0, 5);
}

async function fetchPolicyPages(
  candidates: PolicyCandidate[],
): Promise<PolicyPage[]> {
  const settled =
    await Promise.allSettled(
      candidates.map(
        async (
          candidate,
        ): Promise<PolicyPage> => {
          const page =
            await fetchHtml(
              candidate.url,
            );

          return {
            ...candidate,
            url:
              page.finalUrl,
            text:
              extractVisibleText(
                page.html,
              ),
          };
        },
      ),
    );

  return settled.flatMap(
    (result) =>
      result.status ===
      'fulfilled'
        ? [result.value]
        : [],
  );
}

function extractReturnWindowDays(
  text: string,
): number | null {
  const patterns = [
    /(?:return|refund|withdraw(?:al)?)[^.!?]{0,140}?within\s+(\d{1,3})\s+days?/gi,

    /within\s+(\d{1,3})\s+days?[^.!?]{0,140}?(?:return|refund|withdraw(?:al)?)/gi,

    /(?:return|refund)[^.!?]{0,140}?(\d{1,3})\s+days?/gi,
  ];

  for (const pattern of patterns) {
    for (
      const match of text.matchAll(
        pattern,
      )
    ) {
      const days =
        Number(
          match[1],
        );

      if (
        days >= 1 &&
        days <= 180
      ) {
        return days;
      }
    }
  }

  return null;
}

function extractWarrantyMonths(
  text: string,
): number | null {
  const patterns = [
    /(\d{1,2})\s*(year|month)s?[^.!?]{0,100}warrant(?:y|ies)/gi,

    /warrant(?:y|ies)[^.!?]{0,100}?(\d{1,2})\s*(year|month)s?/gi,
  ];

  for (const pattern of patterns) {
    const match =
      pattern.exec(text);

    if (!match) continue;

    const value =
      Number(
        match[1],
      );

    if (
      !Number.isFinite(
        value,
      ) ||
      value <= 0
    ) {
      continue;
    }

    return match[2]
      .toLowerCase()
      .startsWith('year')
      ? value * 12
      : value;
  }

  return null;
}

function extractRenewal(
  text: string,
): RenewalData {
  const recurringContext =
    text.match(
      /[^.!?]{0,140}(?:subscription|membership|auto[- ]?renew|recurring|renews automatically)[^.!?]{0,180}/i,
    )?.[0];

  if (!recurringContext) {
    return {
      amount: null,
      interval: null,
      currency: null,
    };
  }

  const symbolPrice =
    recurringContext.match(
      /([€$£])\s?(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:\/|per\s+)?(day|week|month|year|annual|monthly|yearly)?/i,
    );

  const codePrice =
    recurringContext.match(
      /(\d{1,6}(?:[.,]\d{1,2})?)\s*(EUR|USD|GBP)\s*(?:\/|per\s+)?(day|week|month|year|annual|monthly|yearly)?/i,
    );

  const amount =
    parsePriceNumber(
      symbolPrice?.[2] ??
        codePrice?.[1],
    );

  const currency =
    symbolPrice
      ? currencyFromSymbol(
          symbolPrice[1],
        )
      : normalizeCurrency(
          codePrice?.[2],
        );

  const rawInterval =
    symbolPrice?.[3] ??
    codePrice?.[3] ??
    null;

  const interval =
    rawInterval
      ? rawInterval
          .toLowerCase()
          .replace(
            'monthly',
            'month',
          )
          .replace(
            'yearly',
            'year',
          )
          .replace(
            'annual',
            'year',
          )
      : null;

  return {
    amount,
    interval,
    currency,
  };
}

function sourceFor(
  pages: PolicyPage[],
  kind:
    PolicyCandidate['kind'],
  fallback: URL,
): string {
  return (
    pages.find(
      (page) =>
        page.kind === kind,
    )?.url.toString() ??
    fallback.toString()
  );
}

function createSignal(
  id: RawSignalDto['id'],
  label: string,
  scorePercent: number,
  statusLabel: string,
): RawSignalDto {
  return {
    id,
    label,
    scorePercent:
      clamp(scorePercent),
    statusLabel,
  };
}

export async function analyzeUrl(
  inputUrl: string,
): Promise<RawScanResponseDto> {
  const page =
    await fetchHtml(
      inputUrl,
    );

  const $ =
    cheerio.load(
      page.html,
    );

  const jsonLd =
    parseJsonLd($);

  const structuredProduct =
    extractStructuredProduct(
      jsonLd,
    );

  const metaPrice =
    extractMetaPrice($);

  const productName =
    structuredProduct.productName ||
    cleanText(
      $(
        'meta[property="og:title"]',
      ).attr('content'),
    ) ||
    cleanText(
      $('h1')
        .first()
        .text(),
    ) ||
    cleanText(
      $('title').text(),
    ) ||
    'Product or offer';

  const ogSiteName =
    cleanText(
      $(
        'meta[property="og:site_name"]',
      ).attr('content'),
    );

  const applicationName =
    cleanText(
      $(
        'meta[name="application-name"]',
      ).attr('content'),
    );

  const merchantName =
    structuredProduct.merchantName ||
    ogSiteName ||
    applicationName ||
    titleCaseDomain(
      page.finalUrl.hostname,
    );

  const price =
    structuredProduct
      .price.amount !== null
      ? structuredProduct.price
      : metaPrice;

  const mainText =
    extractVisibleText(
      page.html,
    );

  const lowerMainText =
    mainText.toLowerCase();

  const policyCandidates =
    discoverPolicies(
      $,
      page.finalUrl,
    );

  const policyPages =
    await fetchPolicyPages(
      policyCandidates,
    );

  const policyText =
    policyPages
      .map(
        (policy) =>
          policy.text,
      )
      .join(' ');

  const combinedText =
    `${mainText} ${policyText}`;

  const returnPolicy =
    policyPages.find(
      (policy) =>
        policy.kind ===
        'returns',
    );

  const termsPolicy =
    policyPages.find(
      (policy) =>
        policy.kind ===
        'terms',
    );

  const cancellationPolicy =
    policyPages.find(
      (policy) =>
        policy.kind ===
        'cancellation',
    );

  const returnText =
    `${
      returnPolicy?.text ??
      ''
    } ${policyText}`;

  const commitmentText =
    `${
      termsPolicy?.text ??
      ''
    } ${
      cancellationPolicy?.text ??
      ''
    } ${mainText}`;

  const returnWindowDays =
    extractReturnWindowDays(
      returnText,
    );

  const warrantyMonths =
    extractWarrantyMonths(
      combinedText,
    );

  const renewal =
    extractRenewal(
      commitmentText,
    );

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

  const mainstreamPayments =
    [
      'paypal',
      'visa',
      'mastercard',
      'american express',
      'apple pay',
      'google pay',
      'klarna',
      'shop pay',
    ].filter((method) =>
      lowerMainText.includes(
        method,
      ),
    );

  const hasContactRoute =
    $(
      'a[href^="mailto:"]',
    ).length > 0 ||
    $(
      'a[href^="tel:"]',
    ).length > 0 ||
    $('a[href]')
      .toArray()
      .some((element) => {
        const text =
          `${
            $(element).text()
          } ${
            $(element).attr(
              'href',
            ) ?? ''
          }`;

        return /contact|support|customer service/i.test(
          text,
        );
      });

  const hasReturnsPolicy =
    Boolean(
      returnPolicy ||
        policyCandidates.some(
          (candidate) =>
            candidate.kind ===
            'returns',
        ),
    );

  const hasTermsPolicy =
    Boolean(
      termsPolicy ||
        policyCandidates.some(
          (candidate) =>
            candidate.kind ===
            'terms',
        ),
    );

  const https =
    page.finalUrl.protocol ===
    'https:';

  let risk = 16;

  if (recurringDetected) {
    risk += 29;
  }

  if (!hasReturnsPolicy) {
    risk += 14;
  }

  if (
    returnShippingPaidByCustomer
  ) {
    risk += 12;
  }

  if (internationalReturn) {
    risk += 10;
  }

  if (
    returnWindowDays !== null &&
    returnWindowDays < 14
  ) {
    risk += 10;
  }

  if (
    discountLanguageDetected
  ) {
    risk += 8;
  }

  if (
    mainstreamPayments.length ===
    0
  ) {
    risk += 7;
  }

  if (!hasContactRoute) {
    risk += 7;
  }

  if (!https) {
    risk += 12;
  }

  if (
    price.amount === null
  ) {
    risk += 5;
  }

  if (
    returnWindowDays !== null &&
    returnWindowDays >= 30
  ) {
    risk -= 4;
  }

  risk =
    clamp(risk);

  let confidence = 43;

  if (
    productName !==
    'Product or offer'
  ) {
    confidence += 10;
  }

  if (
    price.amount !== null
  ) {
    confidence += 13;
  }

  if (
    ogSiteName ||
    structuredProduct.merchantName
  ) {
    confidence += 7;
  }

  if (
    policyPages.length > 0
  ) {
    confidence += 10;
  }

  if (
    returnWindowDays !== null
  ) {
    confidence += 7;
  }

  if (hasTermsPolicy) {
    confidence += 4;
  }

  if (
    mainstreamPayments.length > 0
  ) {
    confidence += 3;
  }

  if (hasContactRoute) {
    confidence += 3;
  }

  confidence =
    clamp(
      confidence,
      35,
      96,
    );

  const identityScore =
    clamp(
      35 +
        (https ? 25 : 0) +
        (
          hasContactRoute
            ? 25
            : 0
        ) +
        (
          ogSiteName
            ? 15
            : 0
        ),
    );

  const pricingScore =
    clamp(
      (
        price.amount !== null
          ? 78
          : 38
      ) -
        (
          discountLanguageDetected
            ? 23
            : 0
        ),
    );

  const returnsScore =
    clamp(
      (
        hasReturnsPolicy
          ? 68
          : 30
      ) +
        (
          returnWindowDays !==
          null
            ? 12
            : 0
        ) -
        (
          returnShippingPaidByCustomer
            ? 22
            : 0
        ) -
        (
          internationalReturn
            ? 12
            : 0
        ),
    );

  const commitmentScore =
    recurringDetected
      ? 24
      : 88;

  const protectionScore =
    mainstreamPayments.length >
    0
      ? 82
      : 44;

  const signals: RawSignalDto[] =
    [
      createSignal(
        'identity',
        'Identity',
        identityScore,
        identityScore >= 75
          ? 'Strong'
          : identityScore >= 55
            ? 'Partial'
            : 'Limited',
      ),

      createSignal(
        'pricing',
        'Pricing',
        pricingScore,
        price.amount === null
          ? 'Unclear'
          : discountLanguageDetected
            ? 'Verify discount'
            : 'Clear',
      ),

      createSignal(
        'returns',
        'Returns',
        returnsScore,
        !hasReturnsPolicy
          ? 'Unclear'
          : returnShippingPaidByCustomer ||
              internationalReturn
            ? 'Friction'
            : 'Visible',
      ),

      createSignal(
        'commitment',
        'Commitment',
        commitmentScore,
        recurringDetected
          ? 'Recurring risk'
          : 'No recurring signal',
      ),

      createSignal(
        'protection',
        'Protection',
        protectionScore,
        mainstreamPayments.length >
        0
          ? 'Mainstream methods'
          : 'Limited visibility',
      ),
    ];

  const findings: RawFindingDto[] =
    [];

  if (recurringDetected) {
    findings.push({
      id:
        'finding_commitment',
      category:
        'Commitment',

      headline:
        renewal.amount !== null
          ? 'Recurring payment language detected'
          : 'Recurring commitment language detected',

      detail:
        renewal.amount !== null
          ? `Backstop found recurring-payment language near a ${renewal.amount.toFixed(2)}${
              renewal.interval
                ? ` per ${renewal.interval}`
                : ''
            } charge. Confirm the exact trigger and cancellation route before paying.`
          : 'Backstop found subscription, membership or automatic-renewal language in the pages inspected. Confirm the exact trigger, price and cancellation route before paying.',

      sourceLabel:
        cancellationPolicy?.label ??
        termsPolicy?.label ??
        'Page terms',

      sourceUrl:
        sourceFor(
          policyPages,
          cancellationPolicy
            ? 'cancellation'
            : 'terms',
          page.finalUrl,
        ),

      severityCode:
        'HIGH',
    });
  } else {
    findings.push({
      id:
        'finding_commitment',

      category:
        'Commitment',

      headline:
        'No recurring commitment language found',

      detail:
        'Backstop did not find obvious subscription, membership or automatic-renewal language in the public pages it inspected. This is evidence, not a guarantee that checkout cannot add one later.',

      sourceLabel:
        hasTermsPolicy
          ? 'Terms inspected'
          : 'Public pages inspected',

      sourceUrl:
        termsPolicy?.url.toString() ??
        page.finalUrl.toString(),

      severityCode:
        'GOOD',
    });
  }

  if (!hasReturnsPolicy) {
    findings.push({
      id:
        'finding_returns',

      category:
        'Returns',

      headline:
        'Return policy could not be located',

      detail:
        'Backstop could not find a clearly labelled return or refund policy from the product page. Before paying, verify whether returns are accepted, the time limit, and who pays the return cost.',

      sourceLabel:
        'Policy discovery',

      sourceUrl:
        page.finalUrl.toString(),

      severityCode:
        'MEDIUM',
    });
  } else if (
    returnShippingPaidByCustomer ||
    internationalReturn
  ) {
    findings.push({
      id:
        'finding_returns',

      category:
        'Returns',

      headline:
        internationalReturn
          ? 'Return route may involve international shipping'
          : 'Customer-paid return shipping detected',

      detail: `${
        returnWindowDays !== null
          ? `A ${returnWindowDays}-day return window was detected. `
          : ''
      }The policy also indicates return-shipping friction that could materially reduce the practical value of a refund.`,

      sourceLabel:
        returnPolicy?.label ??
        'Return policy',

      sourceUrl:
        returnPolicy?.url.toString() ??
        page.finalUrl.toString(),

      severityCode:
        'MEDIUM',
    });
  } else {
    findings.push({
      id:
        'finding_returns',

      category:
        'Returns',

      headline:
        returnWindowDays !== null
          ? `${returnWindowDays}-day return window detected`
          : 'Return policy located',

      detail:
        returnWindowDays !== null
          ? `Backstop located return/refund language indicating a ${returnWindowDays}-day window. The actual deadline will depend on the policy trigger, such as purchase or delivery date.`
          : 'A return/refund policy was located, but Backstop could not reliably extract a single return-window duration from the text.',

      sourceLabel:
        returnPolicy?.label ??
        'Return policy',

      sourceUrl:
        returnPolicy?.url.toString() ??
        page.finalUrl.toString(),

      severityCode:
        'GOOD',
    });
  }

  findings.push({
    id:
      'finding_pricing',

    category:
      'Pricing',

    headline:
      price.amount === null
        ? 'Price could not be reliably extracted'
        : discountLanguageDetected
          ? 'Discount language detected; price history not verified'
          : 'Current displayed price was extracted',

    detail:
      price.amount === null
        ? 'The page structure did not expose a reliable product price to this scanner. Dynamic checkout pricing or script-rendered content may require a browser-based scan in a later build.'
        : discountLanguageDetected
          ? 'The page contains sale or discount language. This build can read the current offer, but it does not yet have an independent historical-price dataset to verify the claimed saving.'
          : 'Backstop extracted the current offer price from structured product data or page metadata. Independent historical-price verification will be added separately.',

    sourceLabel:
      'Product page',

    sourceUrl:
      page.finalUrl.toString(),

    severityCode:
      discountLanguageDetected
        ? 'MEDIUM'
        : price.amount === null
          ? 'INFO'
          : 'GOOD',
  });

  findings.push({
    id:
      'finding_payment',

    category:
      'Payment',

    headline:
      mainstreamPayments.length >
      0
        ? 'Mainstream payment methods detected'
        : 'Payment protection could not be confirmed from this page',

    detail:
      mainstreamPayments.length >
      0
        ? `Backstop found references to ${mainstreamPayments
            .slice(0, 4)
            .join(', ')}. Depending on the provider and transaction, those methods may provide additional dispute routes.`
        : 'No mainstream protected payment method was reliably detected in the public page text. The checkout may still expose options that are not visible until later.',

    sourceLabel:
      'Page payment signals',

    sourceUrl:
      page.finalUrl.toString(),

    severityCode:
      mainstreamPayments.length >
      0
        ? 'GOOD'
        : 'INFO',
  });

  findings.push({
    id:
      'finding_identity',

    category:
      'Identity',

    headline:
      hasContactRoute
        ? 'Merchant contact route detected'
        : 'Merchant contact route was not obvious',

    detail:
      hasContactRoute
        ? 'The inspected page exposes a contact, support, email or telephone route. Backstop has not yet independently verified the legal entity behind the domain.'
        : 'Backstop did not find an obvious contact, support, email or telephone route on the inspected page. Independent company and domain-age verification will be added as separate data sources.',

    sourceLabel:
      'Merchant page',

    sourceUrl:
      page.finalUrl.toString(),

    severityCode:
      hasContactRoute
        ? 'GOOD'
        : 'MEDIUM',
  });

  const currency =
    price.currency ??
    (
      price.amount === null
        ? renewal.currency
        : null
    );

  const estimatedMoneyAtRisk =
    price.amount !== null
      ? price.amount +
        (
          recurringDetected &&
          renewal.amount !== null
            ? renewal.amount
            : 0
        )
      : null;

  const verdict =
    risk >= 75
      ? 'High-friction signals'
      : risk >= 55
        ? 'Proceed carefully'
        : risk >= 32
          ? 'Review the details'
          : 'Lower-friction profile';

  return {
    scanId:
      `scan_${randomUUID()}`,

    merchantName,

    merchantDomain:
      page.finalUrl.hostname.replace(
        /^www\./,
        '',
      ),

    productName,

    currency,

    amount:
      price.amount,

    confidencePercent:
      confidence,

    riskPercent:
      risk,

    verdict,

    scannedAtIso:
      new Date().toISOString(),

    signals,

    findings,

    protection: {
      returnWindowDays,
      warrantyMonths,

      renewalAmount:
        recurringDetected
          ? renewal.amount
          : null,

      renewalIntervalLabel:
        recurringDetected
          ? renewal.interval
          : null,

      estimatedMoneyAtRisk,
    },
  };
}