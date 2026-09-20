import type {
  DomainIntelligence,
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

const formatDomainAge = (days: number | null): string => {
  if (days === null) {
    return 'Not available';
  }

  if (days < 60) {
    return `${days} day${days === 1 ? '' : 's'}`;
  }

  if (days < 730) {
    const months = Math.max(1, Math.floor(days / 30));
    return `${months} month${months === 1 ? '' : 's'}`;
  }

  return `${(days / 365).toFixed(1)} years`;
};

const mapDomainIntelligence = (
  dto: RawScanResponseDto['domainIntelligence'],
): DomainIntelligence => {
  const dnsParts: string[] = [];

  if (dto.nameserverCount !== null) {
    dnsParts.push(
      `${dto.nameserverCount} nameserver${dto.nameserverCount === 1 ? '' : 's'}`,
    );
  }

  if (dto.mailServerCount !== null) {
    dnsParts.push(
      `${dto.mailServerCount} mail route${dto.mailServerCount === 1 ? '' : 's'}`,
    );
  }

  if (dto.addressCount !== null) {
    dnsParts.push(
      `${dto.addressCount} address${dto.addressCount === 1 ? '' : 'es'}`,
    );
  }

  const tlsState: DomainIntelligence['tlsState'] =
    dto.tlsAuthorized === true
      ? 'valid'
      : dto.tlsAuthorized === false
        ? 'issue'
        : 'unavailable';

  const tlsLabel =
    dto.tlsAuthorized === true
      ? dto.tlsValidToIso
        ? `Valid until ${formatDate(dto.tlsValidToIso)}`
        : 'Certificate validated'
      : dto.tlsAuthorized === false
        ? 'Certificate validation issue'
        : dto.tlsReachable
          ? 'Certificate details unavailable'
          : 'TLS probe unavailable';

  return {
    registrableDomain: dto.registrableDomain,
    registrationDateLabel: dto.registrationDateIso
      ? formatDate(dto.registrationDateIso)
      : 'Not available',
    ageLabel: formatDomainAge(dto.domainAgeDays),
    registrarLabel: dto.registrarName ?? 'Not available',
    rdapSourceUrl: dto.rdapSourceUrl,
    dnsLabel: dnsParts.length > 0 ? dnsParts.join(' · ') : 'Not available',
    tlsLabel:
      dto.tlsIssuer && tlsState === 'valid'
        ? `${tlsLabel} · ${dto.tlsIssuer}`
        : tlsLabel,
    tlsState,
  };
};

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

    evidenceCoverage:
      dto.evidenceCoveragePercent,

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

    domainIntelligence:
      mapDomainIntelligence(
        dto.domainIntelligence,
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