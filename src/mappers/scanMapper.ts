import type {
  Finding,
  PurchaseScan,
  RawFindingDto,
  RawScanResponseDto,
  Severity,
} from '../types/purchase';

const severityMap: Record<RawFindingDto['severityCode'], Severity> = {
  HIGH: 'critical',
  MEDIUM: 'warning',
  GOOD: 'positive',
  INFO: 'neutral',
};

const formatMoney = (currency: string, amount: number): string =>
  new Intl.NumberFormat('en-MT', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));

const mapFinding = (finding: RawFindingDto): Finding => ({
  id: finding.id,
  category: finding.category,
  title: finding.headline,
  detail: finding.detail,
  sourceLabel: finding.sourceLabel,
  severity: severityMap[finding.severityCode],
});

export const mapScanResponse = (dto: RawScanResponseDto): PurchaseScan => ({
  id: dto.scanId,
  merchant: dto.merchantName,
  domain: dto.merchantDomain,
  product: dto.productName,
  amountLabel: formatMoney(dto.currency, dto.amount),
  confidence: dto.confidencePercent,
  risk: dto.riskPercent,
  verdict: dto.verdict,
  scannedAtLabel: formatDate(dto.scannedAtIso),
  findings: dto.findings.map(mapFinding),
  protection: {
    returnDeadlineLabel: formatDate(dto.protection.returnDeadlineIso),
    warrantyLabel: `${dto.protection.warrantyMonths} months`,
    renewalLabel:
      dto.protection.renewalIso && dto.protection.renewalAmount !== null
        ? `${formatMoney(dto.currency, dto.protection.renewalAmount)} on ${formatDate(dto.protection.renewalIso)}`
        : null,
    moneyAtRiskLabel: formatMoney(dto.currency, dto.protection.estimatedMoneyAtRisk),
  },
});
