export type Severity = 'critical' | 'warning' | 'positive' | 'neutral';

export interface RawFindingDto {
  id: string;
  category: string;
  headline: string;
  detail: string;
  sourceLabel: string;
  severityCode: 'HIGH' | 'MEDIUM' | 'GOOD' | 'INFO';
}

export interface RawScanResponseDto {
  scanId: string;
  merchantName: string;
  merchantDomain: string;
  productName: string;
  currency: string;
  amount: number;
  confidencePercent: number;
  riskPercent: number;
  verdict: string;
  scannedAtIso: string;
  findings: RawFindingDto[];
  protection: {
    returnDeadlineIso: string;
    warrantyMonths: number;
    renewalAmount: number | null;
    renewalIso: string | null;
    estimatedMoneyAtRisk: number;
  };
}

export interface Finding {
  id: string;
  category: string;
  title: string;
  detail: string;
  sourceLabel: string;
  severity: Severity;
}

export interface PurchaseProtection {
  returnDeadlineLabel: string;
  warrantyLabel: string;
  renewalLabel: string | null;
  moneyAtRiskLabel: string;
}

export interface PurchaseScan {
  id: string;
  merchant: string;
  domain: string;
  product: string;
  amountLabel: string;
  confidence: number;
  risk: number;
  verdict: string;
  scannedAtLabel: string;
  findings: Finding[];
  protection: PurchaseProtection;
}

export interface ProtectedPurchase {
  id: string;
  merchant: string;
  product: string;
  amountLabel: string;
  nextDeadlineLabel: string;
  status: 'protected' | 'attention';
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  icon: 'shield' | 'value' | 'deadline' | 'recovered';
}
