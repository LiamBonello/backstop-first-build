import type { RawScanResponseDto } from '../types/purchase';

export const DEMO_URL =
  'https://novalume-store.com/products/halo-jacket';

export const demoScanResponse: RawScanResponseDto = {
  scanId: 'scan_demo_001',

  merchantName: 'NovaLume',

  merchantDomain: 'novalume-store.com',

  productName: 'Halo Technical Jacket',

  currency: 'EUR',

  amount: 189,

  evidenceCoveragePercent: 92,

  riskPercent: 68,

  verdict: 'Proceed carefully',

  scannedAtIso: '2026-09-20T08:15:00.000Z',

  signals: [
    {
      id: 'identity',
      label: 'Identity',
      scorePercent: 86,
      statusLabel: 'Strong',
    },
    {
      id: 'pricing',
      label: 'Pricing',
      scorePercent: 52,
      statusLabel: 'Verify discount',
    },
    {
      id: 'returns',
      label: 'Returns',
      scorePercent: 34,
      statusLabel: 'Friction',
    },
    {
      id: 'commitment',
      label: 'Commitment',
      scorePercent: 22,
      statusLabel: 'Recurring risk',
    },
    {
      id: 'protection',
      label: 'Protection',
      scorePercent: 84,
      statusLabel: 'Mainstream methods',
    },
  ],

  domainIntelligence: {
    registrableDomain: 'novalume-store.com',
    registrationDateIso: '2026-03-21T10:00:00.000Z',
    domainAgeDays: 183,
    registrarName: 'Demo Registrar',
    rdapSourceUrl: null,
    nameserverCount: 2,
    mailServerCount: 1,
    addressCount: 2,
    tlsReachable: true,
    tlsAuthorized: true,
    tlsValidToIso: '2026-12-20T23:59:59.000Z',
    tlsIssuer: 'Demo CA',
  },

  externalIntelligence: {
    threat: {
      provider: 'GOOGLE_WEB_RISK',
      status: 'NOT_CONFIGURED',
      threatTypes: [],
      errorLabel: null,
    },
    company: {
      publishedLegalName: 'NovaLume Commerce Ltd',
      publishedCompanyNumber: 'NL-2026-0198',
      publishedVatNumber: 'MT99999999',
      publishedSourceUrl: null,
      registryProvider: 'GLEIF',
      registryStatus: 'NO_MATCH',
      matchedLegalName: null,
      matchedCompanyNumber: null,
      matchedJurisdiction: null,
      matchedStatus: null,
      registryUrl: null,
      lei: null,
    },
  },

  findings: [
    {
      id: 'finding_subscription',

      category: 'Commitment',

      headline: 'Recurring membership added at checkout',

      detail:
        'The checkout terms include a €9.99 monthly membership after a 7-day introductory period unless it is deselected before payment.',

      sourceLabel: 'Checkout terms',

      sourceUrl: null,

      severityCode: 'HIGH',
    },

    {
      id: 'finding_returns',

      category: 'Returns',

      headline: 'Returns require international shipping',

      detail:
        'The return policy states that customers cover return postage to a non-EU warehouse. That can materially reduce the value of a refund.',

      sourceLabel: 'Return policy',

      sourceUrl: null,

      severityCode: 'MEDIUM',
    },

    {
      id: 'finding_discount',

      category: 'Pricing',

      headline: 'Discount history could not be verified',

      detail:
        'The store displays a 60% discount, but no reliable historical reference price was found in the demo data used by this first build.',

      sourceLabel: 'Price signal',

      sourceUrl: null,

      severityCode: 'MEDIUM',
    },

    {
      id: 'finding_payment',

      category: 'Payment',

      headline: 'Card and PayPal protection available',

      detail:
        'The checkout offers mainstream payment methods that may provide additional dispute routes if the item never arrives or is materially misrepresented.',

      sourceLabel: 'Checkout methods',

      sourceUrl: null,

      severityCode: 'GOOD',
    },
  ],

  protection: {
    returnWindowDays: 14,

    warrantyMonths: 24,

    renewalAmount: 9.99,

    renewalIntervalLabel: 'month',

    estimatedMoneyAtRisk: 198.99,
  },
};