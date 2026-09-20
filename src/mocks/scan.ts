import type { RawScanResponseDto } from '../types/purchase';

export const DEMO_URL = 'https://novalume-store.com/products/halo-jacket';

export const demoScanResponse: RawScanResponseDto = {
  scanId: 'scan_demo_001',
  merchantName: 'NovaLume',
  merchantDomain: 'novalume-store.com',
  productName: 'Halo Technical Jacket',
  currency: 'EUR',
  amount: 189,
  confidencePercent: 94,
  riskPercent: 68,
  verdict: 'Proceed carefully',
  scannedAtIso: '2026-09-20T08:15:00.000Z',
  findings: [
    {
      id: 'finding_subscription',
      category: 'Commitment',
      headline: 'Recurring membership added at checkout',
      detail:
        'The checkout terms include a €9.99 monthly membership after a 7-day introductory period unless it is deselected before payment.',
      sourceLabel: 'Checkout terms',
      severityCode: 'HIGH',
    },
    {
      id: 'finding_returns',
      category: 'Returns',
      headline: 'Returns require international shipping',
      detail:
        'The return policy states that customers cover return postage to a non-EU warehouse. That can materially reduce the value of a refund.',
      sourceLabel: 'Return policy',
      severityCode: 'MEDIUM',
    },
    {
      id: 'finding_discount',
      category: 'Pricing',
      headline: 'Discount history could not be verified',
      detail:
        'The store displays a 60% discount, but no reliable historical reference price was found in the demo data used by this first build.',
      sourceLabel: 'Price signal',
      severityCode: 'MEDIUM',
    },
    {
      id: 'finding_payment',
      category: 'Payment',
      headline: 'Card and PayPal protection available',
      detail:
        'The checkout offers mainstream payment methods that may provide additional dispute routes if the item never arrives or is materially misrepresented.',
      sourceLabel: 'Checkout methods',
      severityCode: 'GOOD',
    },
  ],
  protection: {
    returnDeadlineIso: '2026-10-04T23:59:59.000Z',
    warrantyMonths: 24,
    renewalAmount: 9.99,
    renewalIso: '2026-09-27T23:59:59.000Z',
    estimatedMoneyAtRisk: 198.99,
  },
};
