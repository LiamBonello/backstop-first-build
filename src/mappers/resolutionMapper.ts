import type {
  RawResolutionCaseDto,
  RawResolutionCaseEventDto,
  ResolutionCase,
  ResolutionCaseEvent,
  ResolutionCaseStatus,
  ResolutionIssueType,
} from '../types/resolution';

const issueLabels: Record<
  ResolutionIssueType,
  string
> = {
  return_refused:
    'Return refused',
  refund_overdue:
    'Refund overdue',
  merchant_unresponsive:
    'Merchant not responding',
  unexpected_renewal:
    'Unexpected renewal',
  warranty_problem:
    'Warranty problem',
  item_not_as_described:
    'Item not as described',
  other:
    'Other purchase problem',
};

const statusLabels: Record<
  ResolutionCaseStatus,
  string
> = {
  draft:
    'Draft',
  merchant_contacted:
    'Merchant contacted',
  awaiting_response:
    'Awaiting response',
  escalated:
    'Escalated',
  refund_promised:
    'Refund promised',
  resolved:
    'Resolved',
  closed:
    'Closed',
};

const formatDateOnly = (
  value: string,
): string =>
  new Intl.DateTimeFormat(
    'en-GB',
    {
      day:
        '2-digit',
      month:
        'short',
      year:
        'numeric',
      timeZone:
        'UTC',
    },
  ).format(
    new Date(
      `${value}T00:00:00.000Z`,
    ),
  );

const formatIso = (
  value: string,
): string =>
  new Intl.DateTimeFormat(
    'en-GB',
    {
      day:
        '2-digit',
      month:
        'short',
      year:
        'numeric',
      hour:
        '2-digit',
      minute:
        '2-digit',
    },
  ).format(
    new Date(
      value,
    ),
  );

const formatMoney = (
  amount: number | null,
  currency: string | null,
): string => {
  if (
    amount === null
  ) {
    return 'Not specified';
  }

  if (!currency) {
    return amount.toFixed(
      2,
    );
  }

  try {
    return new Intl.NumberFormat(
      'en-MT',
      {
        style:
          'currency',
        currency,
        maximumFractionDigits:
          2,
      },
    ).format(
      amount,
    );
  } catch {
    return `${currency} ${amount.toFixed(
      2,
    )}`;
  }
};

const statusTone = (
  status:
    ResolutionCaseStatus,
): ResolutionCase['statusTone'] => {
  if (
    status ===
      'resolved' ||
    status ===
      'closed'
  ) {
    return 'positive';
  }

  if (
    status ===
      'escalated' ||
    status ===
      'refund_promised'
  ) {
    return 'warning';
  }

  return 'neutral';
};

const recommendedAction = (
  status:
    ResolutionCaseStatus,
): string => {
  switch (
    status
  ) {
    case 'draft':
      return 'Send the merchant a clear written request, keep the communication in writing, then record that contact in Backstop.';

    case 'merchant_contacted':
      return 'Record the merchant response or move the case to awaiting response if you are waiting for them to act.';

    case 'awaiting_response':
      return 'Keep the written trail. If the merchant does not respond or misses a promised timeframe, record the escalation.';

    case 'escalated':
      return 'Preserve every message, payment record and policy source. Use the saved case record if you need a payment-provider or consumer-remedy escalation.';

    case 'refund_promised':
      return 'Track whether the promised refund actually arrives. Mark the case resolved only when the money is received or the agreed remedy is completed.';

    case 'resolved':
      return 'The case is resolved. Keep the saved record as evidence of what happened.';

    case 'closed':
      return 'This case is closed. The history remains available in Backstop.';
  }
};

const issueSentence = (
  issue:
    ResolutionIssueType,
): string => {
  switch (
    issue
  ) {
    case 'return_refused':
      return 'My return request has been refused despite the purchase terms I have retained.';

    case 'refund_overdue':
      return 'The refund I am expecting has not been received within the timeframe communicated to me.';

    case 'merchant_unresponsive':
      return 'I have not received a substantive response to my request regarding this purchase.';

    case 'unexpected_renewal':
      return 'I am disputing an unexpected renewal or recurring charge connected with this purchase.';

    case 'warranty_problem':
      return 'I am requesting assistance with a warranty issue affecting this purchase.';

    case 'item_not_as_described':
      return 'The item received does not match the description or expectations created at the time of purchase.';

    case 'other':
      return 'I am requesting assistance with an unresolved problem concerning this purchase.';
  }
};

const messageDraft = (
  raw:
    RawResolutionCaseDto,
): string => {
  const returnReference =
    raw.returnDeadline
      ? ` Backstop records the return deadline as ${formatDateOnly(
          raw.returnDeadline,
        )} based on the terms captured when the purchase was protected.`
      : '';

  return [
    'Hello,',
    '',
    `I am contacting you regarding ${raw.product}, purchased from ${raw.merchant} on ${formatDateOnly(
      raw.purchaseDate,
    )}.`,
    '',
    `${issueSentence(
      raw.issueType,
    )}${returnReference}`,
    '',
    `Requested outcome: ${raw.desiredOutcome}`,
    '',
    'Please confirm in writing how you propose to resolve this matter and any timeframe that applies.',
    '',
    'Regards',
  ].join(
    '\n',
  );
};

const mapEvent = (
  raw:
    RawResolutionCaseEventDto,
): ResolutionCaseEvent => ({
  id:
    raw.id,
  type:
    raw.eventType,
  label:
    raw.eventType ===
      'created'
      ? 'Case created'
      : raw.eventType ===
          'status'
        ? 'Status updated'
        : 'Case note',
  detail:
    raw.detail,
  dateLabel:
    formatIso(
      raw.createdAtIso,
    ),
});

export const mapResolutionCase = (
  raw:
    RawResolutionCaseDto,
): ResolutionCase => ({
  id:
    raw.id,
  purchaseId:
    raw.purchaseId,
  issueType:
    raw.issueType,
  issueLabel:
    issueLabels[
      raw.issueType
    ],
  amountInDispute:
    raw.amountInDispute,
  currency:
    raw.currency,
  amountInDisputeLabel:
    formatMoney(
      raw.amountInDispute,
      raw.currency,
    ),
  desiredOutcome:
    raw.desiredOutcome,
  status:
    raw.status,
  statusLabel:
    statusLabels[
      raw.status
    ],
  statusTone:
    statusTone(
      raw.status,
    ),
  createdAtLabel:
    formatIso(
      raw.createdAtIso,
    ),
  updatedAtLabel:
    formatIso(
      raw.updatedAtIso,
    ),
  merchant:
    raw.merchant,
  domain:
    raw.domain,
  product:
    raw.product,
  purchaseAmountLabel:
    raw.purchaseAmountLabel,
  purchaseDate:
    raw.purchaseDate,
  purchaseDateLabel:
    formatDateOnly(
      raw.purchaseDate,
    ),
  deliveryDate:
    raw.deliveryDate,
  returnDeadline:
    raw.returnDeadline,
  returnDeadlineLabel:
    raw.returnDeadline
      ? formatDateOnly(
          raw.returnDeadline,
        )
      : null,
  warrantyDeadline:
    raw.warrantyDeadline,
  renewalDeadline:
    raw.renewalDeadline,
  evidenceAvailable:
    raw.evidenceAvailable,
  recommendedAction:
    recommendedAction(
      raw.status,
    ),
  messageDraft:
    messageDraft(
      raw,
    ),
  events:
    raw.events.map(
      mapEvent,
    ),
});

export const resolutionIssueOptions = (
  Object.entries(
    issueLabels,
  ) as Array<
    [
      ResolutionIssueType,
      string,
    ]
  >
).map(
  (
    [
      value,
      label,
    ],
  ) => ({
    value,
    label,
  }),
);

export const resolutionStatusOptions = (
  Object.entries(
    statusLabels,
  ) as Array<
    [
      ResolutionCaseStatus,
      string,
    ]
  >
).map(
  (
    [
      value,
      label,
    ],
  ) => ({
    value,
    label,
  }),
);
