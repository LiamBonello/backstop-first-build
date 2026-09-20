export type Severity =
  | 'critical'
  | 'warning'
  | 'positive'
  | 'neutral';

export type SignalId =
  | 'identity'
  | 'pricing'
  | 'returns'
  | 'commitment'
  | 'protection';

export interface RawFindingDto {
  id: string;
  category: string;
  headline: string;
  detail: string;
  sourceLabel: string;
  sourceUrl: string | null;

  severityCode:
    | 'HIGH'
    | 'MEDIUM'
    | 'GOOD'
    | 'INFO';
}

export interface RawSignalDto {
  id: SignalId;
  label: string;
  scorePercent: number;
  statusLabel: string;
}

export interface RawScanResponseDto {
  scanId: string;

  merchantName: string;
  merchantDomain: string;

  productName: string;

  currency: string | null;
  amount: number | null;

  confidencePercent: number;
  riskPercent: number;

  verdict: string;

  scannedAtIso: string;

  signals: RawSignalDto[];
  findings: RawFindingDto[];

  protection: {
    returnWindowDays:
      number | null;

    warrantyMonths:
      number | null;

    renewalAmount:
      number | null;

    renewalIntervalLabel:
      string | null;

    estimatedMoneyAtRisk:
      number | null;
  };
}

export interface Finding {
  id: string;
  category: string;
  title: string;
  detail: string;

  sourceLabel: string;
  sourceUrl: string | null;

  severity: Severity;
}

export interface ScanSignal {
  id: SignalId;
  label: string;
  score: number;
  statusLabel: string;
}

export interface PurchaseProtection {
  returnWindowLabel: string;
  warrantyLabel: string;

  renewalLabel:
    string | null;

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

  signals: ScanSignal[];
  findings: Finding[];

  protection:
    PurchaseProtection;
}

export interface ProtectedPurchase {
  id: string;
  merchant: string;
  product: string;

  amountLabel: string;

  nextDeadlineLabel: string;

  status:
    | 'protected'
    | 'attention';
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;

  icon:
    | 'shield'
    | 'value'
    | 'deadline'
    | 'recovered';
}