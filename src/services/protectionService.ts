import {
  backstopRequestJson,
} from './backstopApi';

import type {
  CreateProtectedPurchaseRequestDto,
  DashboardMetric,
  ProtectedPurchase,
  ProtectedPurchaseRecordDto,
  ProtectionEvidenceSnapshot,
  ProtectionInput,
  ProtectionTimelineItem,
  ProtectionTermsDto,
  PurchaseLifecycleStatus,
  PurchaseScan,
} from '../types/purchase';

const LEGACY_STORAGE_KEY =
  'backstop.protected-purchases.v1';

const MIGRATION_KEY =
  'backstop.postgres-migration.v1';

const isDateOnly = (
  value: unknown,
): value is string =>
  typeof value ===
    'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(
    value,
  );

const isNullableDateOnly = (
  value: unknown,
): value is string | null =>
  value === null ||
  isDateOnly(
    value,
  );

const isNullableNumber = (
  value: unknown,
): value is number | null =>
  value === null ||
  (
    typeof value ===
      'number' &&
    Number.isFinite(
      value,
    )
  );

const isNullableString = (
  value: unknown,
): value is string | null =>
  value === null ||
  typeof value ===
    'string';

const isLifecycleStatus = (
  value: unknown,
): value is PurchaseLifecycleStatus =>
  value === 'active' ||
  value === 'kept' ||
  value === 'returned' ||
  value === 'refunded';

const parseDateOnlyParts = (
  value: string,
): {
  year: number;
  month: number;
  day: number;
} => {
  const [
    year,
    month,
    day,
  ] =
    value
      .split('-')
      .map(Number);

  return {
    year,
    month,
    day,
  };
};

const dateOnlyToUtcMs = (
  value: string,
): number => {
  const {
    year,
    month,
    day,
  } =
    parseDateOnlyParts(
      value,
    );

  return Date.UTC(
    year,
    month - 1,
    day,
  );
};

const utcMsToDateOnly = (
  value: number,
): string =>
  new Date(value)
    .toISOString()
    .slice(
      0,
      10,
    );

const addDays = (
  date: string,
  days: number,
): string =>
  utcMsToDateOnly(
    dateOnlyToUtcMs(
      date,
    ) +
      days *
        24 *
        60 *
        60 *
        1000,
  );

const addMonths = (
  date: string,
  months: number,
): string => {
  const {
    year,
    month,
    day,
  } =
    parseDateOnlyParts(
      date,
    );

  const targetFirst =
    new Date(
      Date.UTC(
        year,
        month - 1 + months,
        1,
      ),
    );

  const targetYear =
    targetFirst.getUTCFullYear();

  const targetMonth =
    targetFirst.getUTCMonth();

  const lastDay =
    new Date(
      Date.UTC(
        targetYear,
        targetMonth + 1,
        0,
      ),
    ).getUTCDate();

  return utcMsToDateOnly(
    Date.UTC(
      targetYear,
      targetMonth,
      Math.min(
        day,
        lastDay,
      ),
    ),
  );
};

const addRenewalInterval = (
  date: string,
  interval: string | null,
): string | null => {
  if (!interval) {
    return null;
  }

  switch (
    interval.toLowerCase()
  ) {
    case 'day':
      return addDays(
        date,
        1,
      );

    case 'week':
      return addDays(
        date,
        7,
      );

    case 'month':
      return addMonths(
        date,
        1,
      );

    case 'year':
      return addMonths(
        date,
        12,
      );

    default:
      return null;
  }
};

export const todayDateValue = (): string => {
  const today =
    new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() +
        1,
    ).padStart(
      2,
      '0',
    );

  const day =
    String(
      today.getDate(),
    ).padStart(
      2,
      '0',
    );

  return `${year}-${month}-${day}`;
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

const formatIsoDate = (
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
    },
  ).format(
    new Date(value),
  );

const daysUntil = (
  value: string,
): number =>
  Math.round(
    (
      dateOnlyToUtcMs(
        value,
      ) -
      dateOnlyToUtcMs(
        todayDateValue(),
      )
    ) /
      (
        24 *
        60 *
        60 *
        1000
      ),
  );

const getDeadlineEntries = (
  purchase:
    Pick<
      ProtectedPurchaseRecordDto,
      | 'returnDeadline'
      | 'warrantyDeadline'
      | 'renewalDeadline'
      | 'lifecycleStatus'
    >,
): DeadlineEntry[] => {
  if (
    purchase.lifecycleStatus ===
      'returned' ||
    purchase.lifecycleStatus ===
      'refunded'
  ) {
    return [];
  }

  const entries:
    DeadlineEntry[] =
      [];

  if (
    purchase.returnDeadline &&
    purchase.lifecycleStatus !==
      'kept'
  ) {
    entries.push({
      kind:
        'Return',
      date:
        purchase.returnDeadline,
    });
  }

  if (
    purchase.warrantyDeadline
  ) {
    entries.push({
      kind:
        'Warranty',
      date:
        purchase.warrantyDeadline,
    });
  }

  if (
    purchase.renewalDeadline
  ) {
    entries.push({
      kind:
        'Renewal',
      date:
        purchase.renewalDeadline,
    });
  }

  return entries;
};

const getNextDeadline = (
  purchase:
    Pick<
      ProtectedPurchaseRecordDto,
      | 'returnDeadline'
      | 'warrantyDeadline'
      | 'renewalDeadline'
      | 'lifecycleStatus'
    >,
): DeadlineEntry | null =>
  getDeadlineEntries(
    purchase,
  )
    .filter(
      (entry) =>
        daysUntil(
          entry.date,
        ) >= 0,
    )
    .sort(
      (
        left,
        right,
      ) =>
        left.date.localeCompare(
          right.date,
        ),
    )[0] ??
  null;

const formatNextDeadline = (
  entry: DeadlineEntry | null,
  lifecycleStatus:
    PurchaseLifecycleStatus,
): string => {
  if (
    lifecycleStatus ===
      'returned' ||
    lifecycleStatus ===
      'refunded'
  ) {
    return lifecycleLabels[
      lifecycleStatus
    ];
  }

  if (!entry) {
    return lifecycleStatus ===
      'kept'
      ? 'Kept · no upcoming tracked deadline'
      : 'No upcoming exact deadline';
  }

  const remaining =
    daysUntil(
      entry.date,
    );

  const relative =
    remaining === 0
      ? 'today'
      : remaining === 1
        ? 'tomorrow'
        : `in ${remaining} days`;

  return `${entry.kind} · ${formatDateOnly(
    entry.date,
  )} (${relative})`;
};

const timelineStateForDate = (
  date: string,
): ProtectionTimelineItem['state'] =>
  daysUntil(
    date,
  ) < 0
    ? 'expired'
    : 'upcoming';

const buildTimeline = (
  record:
    ProtectedPurchaseRecordDto,
): ProtectionTimelineItem[] => {
  const items:
    ProtectionTimelineItem[] =
      [
        {
          id:
            'purchase',
          label:
            'Purchased',
          detail:
            'Purchase date saved in Backstop.',
          dateLabel:
            formatDateOnly(
              record.purchaseDate,
            ),
          state:
            'complete',
        },
      ];

  if (
    record.deliveryDate
  ) {
    items.push({
      id:
        'delivery',
      label:
        'Delivered',
      detail:
        'Delivery date used as the return-window basis.',
      dateLabel:
        formatDateOnly(
          record.deliveryDate,
        ),
      state:
        'complete',
    });
  }

  if (
    record.returnDeadline
  ) {
    items.push({
      id:
        'return',
      label:
        'Return deadline',
      detail:
        record.lifecycleStatus ===
        'kept'
          ? 'Return tracking was closed when this purchase was marked as kept.'
          : 'Calculated from the detected return window and the saved purchase details.',
      dateLabel:
        formatDateOnly(
          record.returnDeadline,
        ),
      state:
        record.lifecycleStatus ===
        'kept'
          ? 'neutral'
          : timelineStateForDate(
              record.returnDeadline,
            ),
    });
  }

  if (
    record.warrantyDeadline
  ) {
    items.push({
      id:
        'warranty',
      label:
        'Warranty expiry',
      detail:
        'Calculated from the detected warranty duration.',
      dateLabel:
        formatDateOnly(
          record.warrantyDeadline,
        ),
      state:
        timelineStateForDate(
          record.warrantyDeadline,
        ),
    });
  }

  if (
    record.renewalDeadline
  ) {
    items.push({
      id:
        'renewal',
      label:
        'Renewal date',
      detail:
        'Calculated from the detected renewal interval.',
      dateLabel:
        formatDateOnly(
          record.renewalDeadline,
        ),
      state:
        timelineStateForDate(
          record.renewalDeadline,
        ),
    });
  }

  if (
    record.lifecycleStatus !==
      'active'
  ) {
    items.push({
      id:
        'lifecycle',
      label:
        lifecycleLabels[
          record.lifecycleStatus
        ],
      detail:
        record.lifecycleStatus ===
        'kept'
          ? 'You marked this purchase as kept.'
          : record.lifecycleStatus ===
              'returned'
            ? 'You marked this purchase as returned.'
            : 'You marked this purchase as refunded.',
      dateLabel:
        record.lifecycleUpdatedAtIso
          ? formatIsoDate(
              record.lifecycleUpdatedAtIso,
            )
          : null,
      state:
        'complete',
    });
  }

  return items;
};

const hydrate = (
  record:
    ProtectedPurchaseRecordDto,
): ProtectedPurchase => {
  const nextDeadline =
    getNextDeadline(
      record,
    );

  const remaining =
    nextDeadline
      ? daysUntil(
          nextDeadline.date,
        )
      : null;

  return {
    id:
      record.id,
    sourceScanId:
      record.sourceScanId,
    merchant:
      record.merchant,
    domain:
      record.domain,
    product:
      record.product,
    amount:
      record.amount,
    currency:
      record.currency,
    amountLabel:
      record.amountLabel,
    purchaseDate:
      record.purchaseDate,
    deliveryDate:
      record.deliveryDate,
    purchaseDateLabel:
      formatDateOnly(
        record.purchaseDate,
      ),
    deliveryDateLabel:
      record.deliveryDate
        ? formatDateOnly(
            record.deliveryDate,
          )
        : null,
    returnDeadline:
      record.returnDeadline,
    warrantyDeadline:
      record.warrantyDeadline,
    renewalDeadline:
      record.renewalDeadline,
    nextDeadlineIso:
      nextDeadline?.date ??
      null,
    nextDeadlineLabel:
      formatNextDeadline(
        nextDeadline,
        record.lifecycleStatus,
      ),
    deadlineCount:
      getDeadlineEntries(
        record,
      ).length,
    lifecycleStatus:
      record.lifecycleStatus,
    lifecycleLabel:
      lifecycleLabels[
        record.lifecycleStatus
      ],
    lifecycleUpdatedLabel:
      record.lifecycleUpdatedAtIso
        ? formatIsoDate(
            record.lifecycleUpdatedAtIso,
          )
        : null,
    evidenceSnapshot:
      record.evidenceSnapshot,
    timeline:
      buildTimeline(
        record,
      ),
    status:
      record.lifecycleStatus ===
        'active' &&
      remaining !== null &&
      remaining <= 7
        ? 'attention'
        : 'protected',
  };
};

const sortHydrated = (
  purchases:
    ProtectedPurchase[],
): ProtectedPurchase[] =>
  purchases.sort(
    (
      left,
      right,
    ) => {
      if (
        left.nextDeadlineIso &&
        right.nextDeadlineIso
      ) {
        return left.nextDeadlineIso.localeCompare(
          right.nextDeadlineIso,
        );
      }

      if (
        left.nextDeadlineIso
      ) {
        return -1;
      }

      if (
        right.nextDeadlineIso
      ) {
        return 1;
      }

      return left.product.localeCompare(
        right.product,
      );
    },
  );

const buildPreviewDeadlines = (
  terms:
    ProtectionTermsDto,
  input:
    ProtectionInput,
) => {
  if (
    !isDateOnly(
      input.purchaseDate,
    )
  ) {
    throw new Error(
      'Enter a valid purchase date.',
    );
  }

  if (
    input.deliveryDate &&
    !isDateOnly(
      input.deliveryDate,
    )
  ) {
    throw new Error(
      'Enter a valid delivery date.',
    );
  }

  if (
    input.deliveryDate &&
    input.deliveryDate <
      input.purchaseDate
  ) {
    throw new Error(
      'Delivery date cannot be earlier than the purchase date.',
    );
  }

  const returnBasis =
    input.deliveryDate ??
    input.purchaseDate;

  return {
    returnDeadline:
      terms.returnWindowDays !==
      null
        ? addDays(
            returnBasis,
            terms.returnWindowDays,
          )
        : null,
    warrantyDeadline:
      terms.warrantyMonths !==
      null
        ? addMonths(
            input.purchaseDate,
            terms.warrantyMonths,
          )
        : null,
    renewalDeadline:
      terms.renewalInterval
        ? addRenewalInterval(
            input.purchaseDate,
            terms.renewalInterval,
          )
        : null,
  };
};

const termsFromScan = (
  scan:
    PurchaseScan,
): ProtectionTermsDto => ({
  returnWindowDays:
    scan.protection
      .returnWindowDays,
  warrantyMonths:
    scan.protection
      .warrantyMonths,
  renewalAmount:
    scan.protection
      .renewalAmount,
  renewalInterval:
    scan.protection
      .renewalInterval,
});

const snapshotFromScan = (
  scan:
    PurchaseScan,
): ProtectionEvidenceSnapshot => ({
  risk:
    scan.risk,
  verdict:
    scan.verdict,
  evidenceCoverage:
    scan.evidenceCoverage,
  scannedAtLabel:
    scan.scannedAtLabel,
  findings:
    scan.findings.map(
      (finding) => ({
        ...finding,
      }),
    ),
});

export const calculateProtectionPreview = (
  scan: PurchaseScan,
  input: ProtectionInput,
) => {
  const deadlines =
    buildPreviewDeadlines(
      termsFromScan(
        scan,
      ),
      input,
    );

  return {
    returnDeadlineLabel:
      deadlines.returnDeadline
        ? formatDateOnly(
            deadlines.returnDeadline,
          )
        : 'Not calculated',
    warrantyDeadlineLabel:
      deadlines.warrantyDeadline
        ? formatDateOnly(
            deadlines.warrantyDeadline,
          )
        : 'Not calculated',
    renewalDeadlineLabel:
      deadlines.renewalDeadline
        ? formatDateOnly(
            deadlines.renewalDeadline,
          )
        : 'Not calculated',
    returnBasisLabel:
      input.deliveryDate
        ? 'Delivery date'
        : 'Purchase date',
  };
};

const formatMonitoredValue = (
  purchases:
    ProtectedPurchase[],
): string => {
  const withValues =
    purchases.filter(
      (
        purchase,
      ): purchase is ProtectedPurchase & {
        amount: number;
        currency: string;
      } =>
        purchase.amount !==
          null &&
        purchase.currency !==
          null,
    );

  if (
    withValues.length ===
    0
  ) {
    return '—';
  }

  const currencies =
    new Set(
      withValues.map(
        (purchase) =>
          purchase.currency,
      ),
    );

  if (
    currencies.size !==
    1
  ) {
    return 'Mixed';
  }

  const currency =
    withValues[0]
      .currency;

  const total =
    withValues.reduce(
      (
        sum,
        purchase,
      ) =>
        sum +
        purchase.amount,
      0,
    );

  return new Intl.NumberFormat(
    'en-MT',
    {
      style:
        'currency',
      currency,
      maximumFractionDigits:
        2,
    },
  ).format(total);
};

export const getDashboardMetrics = (
  purchases:
    ProtectedPurchase[],
): DashboardMetric[] => [
  {
    id:
      'protected',
    label:
      'Purchases protected',
    value:
      String(
        purchases.length,
      ),
    icon:
      'shield',
  },
  {
    id:
      'value',
    label:
      'Value monitored',
    value:
      formatMonitoredValue(
        purchases,
      ),
    icon:
      'value',
  },
  {
    id:
      'deadlines',
    label:
      'Deadlines tracked',
    value:
      String(
        purchases.reduce(
          (
            total,
            purchase,
          ) =>
            total +
            purchase.deadlineCount,
          0,
        ),
      ),
    icon:
      'deadline',
  },
  {
    id:
      'attention',
    label:
      'Needs attention',
    value:
      String(
        purchases.filter(
          (purchase) =>
            purchase.status ===
            'attention',
        ).length,
      ),
    icon:
      'attention',
  },
];

const inferReturnWindowDays = (
  value:
    LegacyProtectedPurchaseV1,
): number | null => {
  if (
    !value.returnDeadline
  ) {
    return null;
  }

  const basis =
    value.deliveryDate ??
    value.purchaseDate;

  const days =
    Math.round(
      (
        dateOnlyToUtcMs(
          value.returnDeadline,
        ) -
        dateOnlyToUtcMs(
          basis,
        )
      ) /
        (
          24 *
          60 *
          60 *
          1000
        ),
    );

  return days > 0 &&
    days <= 180
    ? days
    : null;
};

const inferWarrantyMonths = (
  value:
    LegacyProtectedPurchaseV1,
): number | null => {
  if (
    !value.warrantyDeadline
  ) {
    return null;
  }

  for (
    let months = 1;
    months <= 120;
    months += 1
  ) {
    if (
      addMonths(
        value.purchaseDate,
        months,
      ) ===
      value.warrantyDeadline
    ) {
      return months;
    }
  }

  return null;
};

const inferRenewalInterval = (
  value:
    LegacyProtectedPurchaseV1,
): string | null => {
  if (
    !value.renewalDeadline
  ) {
    return null;
  }

  const candidates = [
    'day',
    'week',
    'month',
    'year',
  ];

  return (
    candidates.find(
      (candidate) =>
        addRenewalInterval(
          value.purchaseDate,
          candidate,
        ) ===
        value.renewalDeadline,
    ) ??
    null
  );
};

const parseLegacyV1 = (
  value: unknown,
): LegacyProtectedPurchaseV1 | null => {
  if (
    typeof value !==
      'object' ||
    value === null ||
    Array.isArray(
      value,
    )
  ) {
    return null;
  }

  const record =
    value as Record<string, unknown>;

  if (
    record.version !== 1 ||
    typeof record.id !==
      'string' ||
    typeof record.sourceScanId !==
      'string' ||
    typeof record.merchant !==
      'string' ||
    typeof record.domain !==
      'string' ||
    typeof record.product !==
      'string' ||
    !isNullableNumber(
      record.amount,
    ) ||
    !isNullableString(
      record.currency,
    ) ||
    typeof record.amountLabel !==
      'string' ||
    !isDateOnly(
      record.purchaseDate,
    ) ||
    !isNullableDateOnly(
      record.deliveryDate,
    ) ||
    !isNullableDateOnly(
      record.returnDeadline,
    ) ||
    !isNullableDateOnly(
      record.warrantyDeadline,
    ) ||
    !isNullableDateOnly(
      record.renewalDeadline,
    ) ||
    typeof record.createdAtIso !==
      'string'
  ) {
    return null;
  }

  return record as unknown as LegacyProtectedPurchaseV1;
};

const parseLegacyV2 = (
  value: unknown,
): LegacyProtectedPurchaseV2 | null => {
  if (
    typeof value !==
      'object' ||
    value === null ||
    Array.isArray(
      value,
    )
  ) {
    return null;
  }

  const record =
    value as Record<string, unknown>;

  if (
    record.version !== 2 ||
    typeof record.id !==
      'string' ||
    typeof record.sourceScanId !==
      'string' ||
    typeof record.merchant !==
      'string' ||
    typeof record.domain !==
      'string' ||
    typeof record.product !==
      'string' ||
    !isNullableNumber(
      record.amount,
    ) ||
    !isNullableString(
      record.currency,
    ) ||
    typeof record.amountLabel !==
      'string' ||
    !isDateOnly(
      record.purchaseDate,
    ) ||
    !isNullableDateOnly(
      record.deliveryDate,
    ) ||
    !isNullableDateOnly(
      record.returnDeadline,
    ) ||
    !isNullableDateOnly(
      record.warrantyDeadline,
    ) ||
    !isNullableDateOnly(
      record.renewalDeadline,
    ) ||
    typeof record.protectionTerms !==
      'object' ||
    record.protectionTerms ===
      null ||
    !isLifecycleStatus(
      record.lifecycleStatus,
    ) ||
    !isNullableString(
      record.lifecycleUpdatedAtIso,
    ) ||
    typeof record.createdAtIso !==
      'string'
  ) {
    return null;
  }

  return record as unknown as LegacyProtectedPurchaseV2;
};

const normalizeLegacyRecord = (
  value: unknown,
): ProtectedPurchaseRecordDto | null => {
  const v2 =
    parseLegacyV2(
      value,
    );

  if (v2) {
    return {
      id:
        v2.id,
      sourceScanId:
        v2.sourceScanId,
      merchant:
        v2.merchant,
      domain:
        v2.domain,
      product:
        v2.product,
      amount:
        v2.amount,
      currency:
        v2.currency,
      amountLabel:
        v2.amountLabel,
      purchaseDate:
        v2.purchaseDate,
      deliveryDate:
        v2.deliveryDate,
      returnDeadline:
        v2.returnDeadline,
      warrantyDeadline:
        v2.warrantyDeadline,
      renewalDeadline:
        v2.renewalDeadline,
      protectionTerms:
        v2.protectionTerms,
      lifecycleStatus:
        v2.lifecycleStatus,
      lifecycleUpdatedAtIso:
        v2.lifecycleUpdatedAtIso,
      evidenceSnapshot:
        v2.evidenceSnapshot,
      createdAtIso:
        v2.createdAtIso,
    };
  }

  const v1 =
    parseLegacyV1(
      value,
    );

  if (!v1) {
    return null;
  }

  return {
    id:
      v1.id,
    sourceScanId:
      v1.sourceScanId,
    merchant:
      v1.merchant,
    domain:
      v1.domain,
    product:
      v1.product,
    amount:
      v1.amount,
    currency:
      v1.currency,
    amountLabel:
      v1.amountLabel,
    purchaseDate:
      v1.purchaseDate,
    deliveryDate:
      v1.deliveryDate,
    returnDeadline:
      v1.returnDeadline,
    warrantyDeadline:
      v1.warrantyDeadline,
    renewalDeadline:
      v1.renewalDeadline,
    protectionTerms: {
      returnWindowDays:
        inferReturnWindowDays(
          v1,
        ),
      warrantyMonths:
        inferWarrantyMonths(
          v1,
        ),
      renewalAmount:
        null,
      renewalInterval:
        inferRenewalInterval(
          v1,
        ),
    },
    lifecycleStatus:
      'active',
    lifecycleUpdatedAtIso:
      null,
    evidenceSnapshot:
      null,
    createdAtIso:
      v1.createdAtIso,
  };
};

const migrateLegacyStorage = async (): Promise<void> => {
  if (
    window.localStorage.getItem(
      MIGRATION_KEY,
    ) === 'done'
  ) {
    return;
  }

  const raw =
    window.localStorage.getItem(
      LEGACY_STORAGE_KEY,
    );

  if (!raw) {
    window.localStorage.setItem(
      MIGRATION_KEY,
      'done',
    );

    return;
  }

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(
        raw,
      ) as unknown;
  } catch {
    return;
  }

  if (
    !Array.isArray(
      parsed,
    )
  ) {
    return;
  }

  const records =
    parsed.flatMap(
      (value) => {
        const normalized =
          normalizeLegacyRecord(
            value,
          );

        return normalized
          ? [normalized]
          : [];
      },
    );

  if (
    parsed.length > 0 &&
    records.length !==
      parsed.length
  ) {
    throw new Error(
      'Backstop found legacy protection data that could not be migrated safely. The original browser data has been preserved.',
    );
  }

  if (
    records.length > 0
  ) {
    await backstopRequestJson<void>(
      '/api/protection/import',
      {
        method:
          'POST',
        body:
          JSON.stringify({
            records,
          }),
      },
    );
  }

  window.localStorage.removeItem(
    LEGACY_STORAGE_KEY,
  );

  window.localStorage.setItem(
    MIGRATION_KEY,
    'done',
  );
};

const createRequest = (
  scan:
    PurchaseScan,
  input:
    ProtectionInput,
): CreateProtectedPurchaseRequestDto => ({
  sourceScanId:
    scan.id,
  merchant:
    scan.merchant,
  domain:
    scan.domain,
  product:
    scan.product,
  amount:
    scan.amount,
  currency:
    scan.currency,
  amountLabel:
    scan.amountLabel,
  purchaseDate:
    input.purchaseDate,
  deliveryDate:
    input.deliveryDate,
  protectionTerms:
    termsFromScan(
      scan,
    ),
  evidenceSnapshot:
    snapshotFromScan(
      scan,
    ),
});

export const protectionService = {
  async list(): Promise<
    ProtectedPurchase[]
  > {
    await migrateLegacyStorage();

    const response =
      await backstopRequestJson<{
        records:
          ProtectedPurchaseRecordDto[];
      }>(
        '/api/protection',
      );

    return sortHydrated(
      response.records.map(
        hydrate,
      ),
    );
  },

  async protect(
    scan: PurchaseScan,
    input: ProtectionInput,
  ): Promise<ProtectedPurchase> {
    const record =
      await backstopRequestJson<ProtectedPurchaseRecordDto>(
        '/api/protection',
        {
          method:
            'POST',
          body:
            JSON.stringify(
              createRequest(
                scan,
                input,
              ),
            ),
        },
      );

    return hydrate(
      record,
    );
  },

  async updateDates(
    id: string,
    input: ProtectionInput,
  ): Promise<ProtectedPurchase> {
    const record =
      await backstopRequestJson<ProtectedPurchaseRecordDto>(
        `/api/protection/${encodeURIComponent(
          id,
        )}/dates`,
        {
          method:
            'PATCH',
          body:
            JSON.stringify(
              input,
            ),
        },
      );

    return hydrate(
      record,
    );
  },

  async setLifecycle(
    id: string,
    lifecycleStatus:
      PurchaseLifecycleStatus,
  ): Promise<ProtectedPurchase> {
    const record =
      await backstopRequestJson<ProtectedPurchaseRecordDto>(
        `/api/protection/${encodeURIComponent(
          id,
        )}/lifecycle`,
        {
          method:
            'PATCH',
          body:
            JSON.stringify({
              lifecycleStatus,
            }),
        },
      );

    return hydrate(
      record,
    );
  },

  async remove(
    id: string,
  ): Promise<void> {
    await backstopRequestJson<void>(
      `/api/protection/${encodeURIComponent(
        id,
      )}`,
      {
        method:
          'DELETE',
      },
    );
  },
};
