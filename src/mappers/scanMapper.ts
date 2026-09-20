import type {
  Finding,
  PurchaseScan,
  RawFindingDto,
  RawScanResponseDto,
  ScanSignal,
  Severity,
} from '../types/purchase';

const severityMap: Record<
  RawFindingDto['severityCode'],
  Severity
> = {
  HIGH: 'critical',
  MEDIUM: 'warning',
  GOOD: 'positive',
  INFO: 'neutral',
};

const formatMoney = (
  currency: string,
  amount: number,
): string =>
  new Intl.NumberFormat(
    'en-MT',
    {
      style: 'currency',
      currency,

      maximumFractionDigits:
        2,
    },
  ).format(amount);

const formatDate = (
  iso: string,
): string =>
  new Intl.DateTimeFormat(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(
    new Date(iso),
  );

const mapFinding = (
  finding: RawFindingDto,
): Finding => ({
  id: finding.id,

  category:
    finding.category,

  title:
    finding.headline,

  detail:
    finding.detail,

  sourceLabel:
    finding.sourceLabel,

  sourceUrl:
    finding.sourceUrl,

  severity:
    severityMap[
      finding.severityCode
    ],
});

const mapSignal = (
  signal:
    RawScanResponseDto['signals'][number],
): ScanSignal => ({
  id: signal.id,

  label:
    signal.label,

  score:
    signal.scorePercent,

  statusLabel:
    signal.statusLabel,
});

export const mapScanResponse = (
  dto: RawScanResponseDto,
): PurchaseScan => {
  const canFormatMoney =
    dto.currency !== null &&
    dto.amount !== null;

  const canFormatRisk =
    dto.currency !== null &&
    dto.protection
      .estimatedMoneyAtRisk !==
      null;

  return {
    id: dto.scanId,

    merchant:
      dto.merchantName,

    domain:
      dto.merchantDomain,

    product:
      dto.productName,

    amountLabel:
      canFormatMoney
        ? formatMoney(
            dto.currency!,
            dto.amount!,
          )
        : 'Price not detected',

    confidence:
      dto.confidencePercent,

    risk:
      dto.riskPercent,

    verdict:
      dto.verdict,

    scannedAtLabel:
      formatDate(
        dto.scannedAtIso,
      ),

    signals:
      dto.signals.map(
        mapSignal,
      ),

    findings:
      dto.findings.map(
        mapFinding,
      ),

    protection: {
      returnWindowLabel:
        dto.protection
          .returnWindowDays !==
        null
          ? `${dto.protection.returnWindowDays} days from the qualifying purchase/delivery event`
          : 'Not confirmed',

      warrantyLabel:
        dto.protection
          .warrantyMonths !==
        null
          ? `${dto.protection.warrantyMonths} months detected`
          : 'Not confirmed',

      renewalLabel:
        dto.protection
            .renewalAmount !==
          null &&
        dto.currency !== null
          ? `${formatMoney(
              dto.currency,
              dto.protection
                .renewalAmount,
            )}${
              dto.protection
                .renewalIntervalLabel
                ? ` per ${dto.protection.renewalIntervalLabel}`
                : ' recurring'
            }`
          : null,

      moneyAtRiskLabel:
        canFormatRisk
          ? formatMoney(
              dto.currency!,
              dto.protection
                .estimatedMoneyAtRisk!,
            )
          : 'Not calculated',
    },
  };
};