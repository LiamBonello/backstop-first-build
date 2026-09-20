import type {
  CompanyIntelligence,
  DomainIntelligence,
  ExternalIntelligence,
  Finding,
  ThreatIntelligence,
  PurchaseScan,
  RawFindingDto,
  RawScanResponseDto,
  RiskBreakdown,
  RiskFactor,
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

const mapRiskFactor = (
  factor:
    RawScanResponseDto['riskBreakdown']['factors'][number],
): RiskFactor => ({
  id: factor.id,
  label: factor.label,
  detail: factor.detail,
  impactPoints: factor.impactPoints,
  impactLabel:
    factor.impactPoints > 0
      ? `+${factor.impactPoints}`
      : `${factor.impactPoints}`,
  tone:
    factor.impactPoints > 0
      ? 'increase'
      : 'decrease',
});

const mapRiskBreakdown = (
  dto: RawScanResponseDto['riskBreakdown'],
  finalRisk: number,
): RiskBreakdown => {
  const factors = dto.factors.map(mapRiskFactor);

  const adjustmentExpression =
    factors.length > 0
      ? factors
          .map((factor) =>
            factor.impactPoints > 0
              ? `+ ${factor.impactPoints}`
              : `- ${Math.abs(factor.impactPoints)}`,
          )
          .join(' ')
      : '';

  return {
    baselinePoints: dto.baselinePoints,
    baselineLabel: 'Model baseline',
    baselineDetail:
      'Every scan starts above zero so that an absence of detected problems is not presented as proof of zero risk.',
    uncappedPoints: dto.uncappedPoints,
    calculationLabel:
      `${dto.baselinePoints}${adjustmentExpression ? ` ${adjustmentExpression}` : ''} = ${finalRisk}`,
    factors,
  };
};

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

const mapThreatIntelligence = (
  dto: RawScanResponseDto['externalIntelligence']['threat'],
): ThreatIntelligence => {
  if (dto.status === 'FLAGGED') {
    return {
      statusLabel: 'Flagged',
      detailLabel:
        dto.threatTypes.length > 0
          ? `Matched: ${dto.threatTypes.join(', ')}`
          : 'The configured threat provider returned a match.',
      tone: 'critical',
    };
  }

  if (dto.status === 'CLEAR') {
    return {
      statusLabel: 'No list match',
      detailLabel:
        'No match was returned for malware, social engineering or unwanted-software lists. This is not proof that the site is safe.',
      tone: 'positive',
    };
  }

  if (dto.status === 'NOT_CONFIGURED') {
    return {
      statusLabel: 'Not configured',
      detailLabel:
        'Google Web Risk is available as an optional server-side check once an API key is configured.',
      tone: 'neutral',
    };
  }

  return {
    statusLabel: 'Unavailable',
    detailLabel:
      dto.errorLabel ??
      'The configured threat provider could not be reached for this scan.',
    tone: 'warning',
  };
};

const mapCompanyIntelligence = (
  dto: RawScanResponseDto['externalIntelligence']['company'],
): CompanyIntelligence => {
  const identifiers = [
    dto.publishedCompanyNumber
      ? `Company no. ${dto.publishedCompanyNumber}`
      : null,
    dto.publishedVatNumber
      ? `VAT ${dto.publishedVatNumber}`
      : null,
  ].filter((value): value is string => value !== null);

  const publishedIdentityLabel = dto.publishedLegalName
    ? [dto.publishedLegalName, ...identifiers].join(' · ')
    : identifiers.length > 0
      ? identifiers.join(' · ')
      : 'No legal entity was reliably extracted from the inspected pages.';

  if (dto.registryStatus === 'MATCHED') {
    const matchParts = [
      dto.matchedLegalName,
      dto.matchedCompanyNumber
        ? `no. ${dto.matchedCompanyNumber}`
        : null,
      dto.matchedJurisdiction,
      dto.matchedStatus,
    ].filter((value): value is string => Boolean(value));

    return {
      publishedIdentityLabel,
      publishedSourceUrl: dto.publishedSourceUrl,
      registryStatusLabel: 'GLEIF match',
      registryDetailLabel:
        [
          ...matchParts,
          dto.lei ? `LEI ${dto.lei}` : null,
        ]
          .filter((value): value is string => Boolean(value))
          .join(' · ') || 'GLEIF LEI record matched.',
      registryUrl: dto.registryUrl,
      tone: 'positive',
    };
  }

  if (dto.registryStatus === 'NO_MATCH') {
    return {
      publishedIdentityLabel,
      publishedSourceUrl: dto.publishedSourceUrl,
      registryStatusLabel: 'No LEI record',
      registryDetailLabel:
        'GLEIF did not return a sufficiently close LEI record for the published legal entity. Many legitimate businesses do not have an LEI, so this is informational only.',
      registryUrl: null,
      tone: 'neutral',
    };
  }

  if (dto.registryStatus === 'NOT_CHECKED') {
    return {
      publishedIdentityLabel,
      publishedSourceUrl: dto.publishedSourceUrl,
      registryStatusLabel: 'Not checked',
      registryDetailLabel:
        'Backstop needs a published legal entity before attempting an LEI lookup.',
      registryUrl: null,
      tone: 'neutral',
    };
  }

  return {
    publishedIdentityLabel,
    publishedSourceUrl: dto.publishedSourceUrl,
    registryStatusLabel: 'GLEIF unavailable',
    registryDetailLabel:
      'The free GLEIF company-identity lookup could not complete for this scan.',
    registryUrl: null,
    tone: 'warning',
  };
};

const mapExternalIntelligence = (
  dto: RawScanResponseDto['externalIntelligence'],
): ExternalIntelligence => ({
  threat: mapThreatIntelligence(dto.threat),
  company: mapCompanyIntelligence(dto.company),
});

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

    riskBreakdown:
      mapRiskBreakdown(
        dto.riskBreakdown,
        dto.riskPercent,
      ),

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

    externalIntelligence:
      mapExternalIntelligence(
        dto.externalIntelligence,
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