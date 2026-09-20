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

export interface RawRiskFactorDto {
  id: string;
  label: string;
  detail: string;
  impactPoints: number;
}

export interface RawRiskBreakdownDto {
  baselinePoints: number;
  uncappedPoints: number;
  factors: RawRiskFactorDto[];
}

export interface RawDomainIntelligenceDto {
  registrableDomain: string;
  registrationDateIso: string | null;
  domainAgeDays: number | null;
  registrarName: string | null;
  rdapSourceUrl: string | null;
  nameserverCount: number | null;
  mailServerCount: number | null;
  addressCount: number | null;
  tlsReachable: boolean;
  tlsAuthorized: boolean | null;
  tlsValidToIso: string | null;
  tlsIssuer: string | null;
}

export interface RawThreatIntelligenceDto {
  provider: 'GOOGLE_WEB_RISK';
  status: 'CLEAR' | 'FLAGGED' | 'NOT_CONFIGURED' | 'UNAVAILABLE';
  threatTypes: string[];
  errorLabel: string | null;
}

export interface RawCompanyIntelligenceDto {
  publishedLegalName: string | null;
  publishedCompanyNumber: string | null;
  publishedVatNumber: string | null;
  publishedSourceUrl: string | null;
  registryProvider: 'GLEIF';
  registryStatus:
    | 'MATCHED'
    | 'NO_MATCH'
    | 'NOT_CHECKED'
    | 'UNAVAILABLE';
  matchedLegalName: string | null;
  matchedCompanyNumber: string | null;
  matchedJurisdiction: string | null;
  matchedStatus: string | null;
  registryUrl: string | null;
  lei: string | null;
}

export interface RawExternalIntelligenceDto {
  threat: RawThreatIntelligenceDto;
  company: RawCompanyIntelligenceDto;
}

export interface RawScanResponseDto {
  scanId: string;
  scanMethod: 'STATIC_HTML' | 'BROWSER_RENDERED';

  merchantName: string;
  merchantDomain: string;

  productName: string;

  currency: string | null;
  amount: number | null;

  evidenceCoveragePercent: number;
  riskPercent: number;
  riskBreakdown: RawRiskBreakdownDto;

  verdict: string;

  scannedAtIso: string;

  signals: RawSignalDto[];
  findings: RawFindingDto[];
  domainIntelligence: RawDomainIntelligenceDto;
  externalIntelligence: RawExternalIntelligenceDto;

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

export interface RiskFactor {
  id: string;
  label: string;
  detail: string;
  impactPoints: number;
  impactLabel: string;
  tone: 'increase' | 'decrease';
}

export interface RiskBreakdown {
  baselinePoints: number;
  baselineLabel: string;
  baselineDetail: string;
  uncappedPoints: number;
  calculationLabel: string;
  factors: RiskFactor[];
}

export interface DomainIntelligence {
  registrableDomain: string;
  registrationDateLabel: string;
  ageLabel: string;
  registrarLabel: string;
  rdapSourceUrl: string | null;
  dnsLabel: string;
  tlsLabel: string;
  tlsState: 'valid' | 'issue' | 'unavailable';
}

export type IntelligenceTone =
  | 'positive'
  | 'warning'
  | 'critical'
  | 'neutral';

export interface ThreatIntelligence {
  statusLabel: string;
  detailLabel: string;
  tone: IntelligenceTone;
}

export interface CompanyIntelligence {
  publishedIdentityLabel: string;
  publishedSourceUrl: string | null;
  registryStatusLabel: string;
  registryDetailLabel: string;
  registryUrl: string | null;
  tone: IntelligenceTone;
}

export interface ExternalIntelligence {
  threat: ThreatIntelligence;
  company: CompanyIntelligence;
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
  scanMethod: 'static' | 'browser';

  merchant: string;
  domain: string;
  product: string;

  amountLabel: string;

  evidenceCoverage: number;
  risk: number;
  riskBreakdown: RiskBreakdown;

  verdict: string;

  scannedAtLabel: string;

  signals: ScanSignal[];
  findings: Finding[];
  domainIntelligence: DomainIntelligence;
  externalIntelligence: ExternalIntelligence;

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