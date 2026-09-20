import type {
  DashboardMetric,
  Finding,
  ProtectedPurchase,
  ProtectionEvidenceSnapshot,
  ProtectionInput,
  ProtectionTimelineItem,
  PurchaseLifecycleStatus,
  PurchaseScan,
} from '../types/purchase';

const STORAGE_KEY = 'backstop.protected-purchases.v1';

interface StoredProtectedPurchaseV1 {
  version: 1;
  id: string;
  sourceScanId: string;
  merchant: string;
  domain: string;
  product: string;
  amount: number | null;
  currency: string | null;
  amountLabel: string;
  purchaseDate: string;
  deliveryDate: string | null;
  returnDeadline: string | null;
  warrantyDeadline: string | null;
  renewalDeadline: string | null;
  createdAtIso: string;
}

interface StoredProtectionTerms {
  returnWindowDays: number | null;
  warrantyMonths: number | null;
  renewalAmount: number | null;
  renewalInterval: string | null;
}

interface StoredProtectedPurchaseV2 {
  version: 2;
  id: string;
  sourceScanId: string;
  merchant: string;
  domain: string;
  product: string;
  amount: number | null;
  currency: string | null;
  amountLabel: string;
  purchaseDate: string;
  deliveryDate: string | null;
  returnDeadline: string | null;
  warrantyDeadline: string | null;
  renewalDeadline: string | null;
  protectionTerms: StoredProtectionTerms;
  lifecycleStatus: PurchaseLifecycleStatus;
  lifecycleUpdatedAtIso: string | null;
  evidenceSnapshot: ProtectionEvidenceSnapshot | null;
  createdAtIso: string;
}

type StoredProtectedPurchase = StoredProtectedPurchaseV2;

interface DeadlineEntry {
  kind: 'Return' | 'Warranty' | 'Renewal';
  date: string;
}

const lifecycleLabels: Record<
  PurchaseLifecycleStatus,
  string
> = {
  active: 'Active protection',
  kept: 'Kept',
  returned: 'Returned',
  refunded: 'Refunded',
};

const isDateOnly = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value);

const isNullableDateOnly = (value: unknown): value is string | null =>
  value === null || isDateOnly(value);

const isNullableNumber = (value: unknown): value is number | null =>
  value === null ||
  (typeof value === 'number' && Number.isFinite(value));

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const isLifecycleStatus = (
  value: unknown,
): value is PurchaseLifecycleStatus =>
  value === 'active' ||
  value === 'kept' ||
  value === 'returned' ||
  value === 'refunded';

const isFinding = (value: unknown): value is Finding => {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.id === 'string' &&
    typeof record.category === 'string' &&
    typeof record.title === 'string' &&
    typeof record.detail === 'string' &&
    typeof record.sourceLabel === 'string' &&
    isNullableString(record.sourceUrl) &&
    (
      record.severity === 'critical' ||
      record.severity === 'warning' ||
      record.severity === 'positive' ||
      record.severity === 'neutral'
    )
  );
};

const isEvidenceSnapshot = (
  value: unknown,
): value is ProtectionEvidenceSnapshot => {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.risk === 'number' &&
    Number.isFinite(record.risk) &&
    typeof record.verdict === 'string' &&
    typeof record.evidenceCoverage === 'number' &&
    Number.isFinite(record.evidenceCoverage) &&
    typeof record.scannedAtLabel === 'string' &&
    Array.isArray(record.findings) &&
    record.findings.every(isFinding)
  );
};

const isProtectionTerms = (
  value: unknown,
): value is StoredProtectionTerms => {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isNullableNumber(record.returnWindowDays) &&
    isNullableNumber(record.warrantyMonths) &&
    isNullableNumber(record.renewalAmount) &&
    isNullableString(record.renewalInterval)
  );
};

const isStoredProtectedPurchaseV1 = (
  value: unknown,
): value is StoredProtectedPurchaseV1 => {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    record.version === 1 &&
    typeof record.id === 'string' &&
    typeof record.sourceScanId === 'string' &&
    typeof record.merchant === 'string' &&
    typeof record.domain === 'string' &&
    typeof record.product === 'string' &&
    isNullableNumber(record.amount) &&
    isNullableString(record.currency) &&
    typeof record.amountLabel === 'string' &&
    isDateOnly(record.purchaseDate) &&
    isNullableDateOnly(record.deliveryDate) &&
    isNullableDateOnly(record.returnDeadline) &&
    isNullableDateOnly(record.warrantyDeadline) &&
    isNullableDateOnly(record.renewalDeadline) &&
    typeof record.createdAtIso === 'string'
  );
};

const isStoredProtectedPurchaseV2 = (
  value: unknown,
): value is StoredProtectedPurchaseV2 => {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    record.version === 2 &&
    typeof record.id === 'string' &&
    typeof record.sourceScanId === 'string' &&
    typeof record.merchant === 'string' &&
    typeof record.domain === 'string' &&
    typeof record.product === 'string' &&
    isNullableNumber(record.amount) &&
    isNullableString(record.currency) &&
    typeof record.amountLabel === 'string' &&
    isDateOnly(record.purchaseDate) &&
    isNullableDateOnly(record.deliveryDate) &&
    isNullableDateOnly(record.returnDeadline) &&
    isNullableDateOnly(record.warrantyDeadline) &&
    isNullableDateOnly(record.renewalDeadline) &&
    isProtectionTerms(record.protectionTerms) &&
    isLifecycleStatus(record.lifecycleStatus) &&
    isNullableString(record.lifecycleUpdatedAtIso) &&
    (
      record.evidenceSnapshot === null ||
      isEvidenceSnapshot(record.evidenceSnapshot)
    ) &&
    typeof record.createdAtIso === 'string'
  );
};

const parseDateOnlyParts = (
  value: string,
): {
  year: number;
  month: number;
  day: number;
} => {
  const [year, month, day] =
    value.split('-').map(Number);

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
  } = parseDateOnlyParts(value);

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
    .slice(0, 10);

const addDays = (
  date: string,
  days: number,
): string =>
  utcMsToDateOnly(
    dateOnlyToUtcMs(date) +
      days * 24 * 60 * 60 * 1000,
  );

const addMonths = (
  date: string,
  months: number,
): string => {
  const {
    year,
    month,
    day,
  } = parseDateOnlyParts(date);

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
      Math.min(day, lastDay),
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

  switch (interval.toLowerCase()) {
    case 'day':
      return addDays(date, 1);

    case 'week':
      return addDays(date, 7);

    case 'month':
      return addMonths(date, 1);

    case 'year':
      return addMonths(date, 12);

    default:
      return null;
  }
};

export const todayDateValue = (): string => {
  const today = new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() + 1,
    ).padStart(2, '0');

  const day =
    String(
      today.getDate(),
    ).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatDateOnly = (
  value: string,
): string =>
  new Intl.DateTimeFormat(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
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
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(
    new Date(value),
  );

const daysUntil = (
  value: string,
): number =>
  Math.round(
    (
      dateOnlyToUtcMs(value) -
      dateOnlyToUtcMs(
        todayDateValue(),
      )
    ) /
      (24 * 60 * 60 * 1000),
  );

const inferReturnWindowDays = (
  record: StoredProtectedPurchaseV1,
): number | null => {
  if (!record.returnDeadline) {
    return null;
  }

  const basis =
    record.deliveryDate ??
    record.purchaseDate;

  const difference =
    Math.round(
      (
        dateOnlyToUtcMs(
          record.returnDeadline,
        ) -
        dateOnlyToUtcMs(
          basis,
        )
      ) /
        (24 * 60 * 60 * 1000),
    );

  return difference >= 1 &&
    difference <= 180
    ? difference
    : null;
};

const inferWarrantyMonths = (
  record: StoredProtectedPurchaseV1,
): number | null => {
  if (!record.warrantyDeadline) {
    return null;
  }

  for (
    let months = 1;
    months <= 120;
    months += 1
  ) {
    if (
      addMonths(
        record.purchaseDate,
        months,
      ) ===
      record.warrantyDeadline
    ) {
      return months;
    }
  }

  return null;
};

const inferRenewalInterval = (
  record: StoredProtectedPurchaseV1,
): string | null => {
  if (!record.renewalDeadline) {
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
          record.purchaseDate,
          candidate,
        ) ===
        record.renewalDeadline,
    ) ?? null
  );
};

const migrateV1 = (
  record: StoredProtectedPurchaseV1,
): StoredProtectedPurchaseV2 => ({
  version: 2,
  id: record.id,
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
  returnDeadline:
    record.returnDeadline,
  warrantyDeadline:
    record.warrantyDeadline,
  renewalDeadline:
    record.renewalDeadline,
  protectionTerms: {
    returnWindowDays:
      inferReturnWindowDays(
        record,
      ),
    warrantyMonths:
      inferWarrantyMonths(
        record,
      ),
    renewalAmount:
      null,
    renewalInterval:
      inferRenewalInterval(
        record,
      ),
  },
  lifecycleStatus:
    'active',
  lifecycleUpdatedAtIso:
    null,
  evidenceSnapshot:
    null,
  createdAtIso:
    record.createdAtIso,
});

const normalizeStoredPurchase = (
  value: unknown,
): StoredProtectedPurchase | null => {
  if (
    isStoredProtectedPurchaseV2(
      value,
    )
  ) {
    return value;
  }

  if (
    isStoredProtectedPurchaseV1(
      value,
    )
  ) {
    return migrateV1(
      value,
    );
  }

  return null;
};

const getDeadlineEntries = (
  purchase:
    Pick<
      StoredProtectedPurchase,
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

  const entries: DeadlineEntry[] = [];

  if (
    purchase.returnDeadline &&
    purchase.lifecycleStatus !==
      'kept'
  ) {
    entries.push({
      kind: 'Return',
      date:
        purchase.returnDeadline,
    });
  }

  if (
    purchase.warrantyDeadline
  ) {
    entries.push({
      kind: 'Warranty',
      date:
        purchase.warrantyDeadline,
    });
  }

  if (
    purchase.renewalDeadline
  ) {
    entries.push({
      kind: 'Renewal',
      date:
        purchase.renewalDeadline,
    });
  }

  return entries;
};

const getNextDeadline = (
  purchase:
    Pick<
      StoredProtectedPurchase,
      | 'returnDeadline'
      | 'warrantyDeadline'
      | 'renewalDeadline'
      | 'lifecycleStatus'
    >,
): DeadlineEntry | null =>
  getDeadlineEntries(purchase)
    .filter(
      (entry) =>
        daysUntil(
          entry.date,
        ) >= 0,
    )
    .sort(
      (left, right) =>
        left.date.localeCompare(
          right.date,
        ),
    )[0] ?? null;

const formatNextDeadline = (
  entry: DeadlineEntry | null,
  lifecycleStatus: PurchaseLifecycleStatus,
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
    daysUntil(entry.date);

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
  daysUntil(date) < 0
    ? 'expired'
    : 'upcoming';

const buildTimeline = (
  stored: StoredProtectedPurchase,
): ProtectionTimelineItem[] => {
  const items: ProtectionTimelineItem[] = [
    {
      id: 'purchase',
      label: 'Purchased',
      detail:
        'Purchase date saved in Backstop.',
      dateLabel:
        formatDateOnly(
          stored.purchaseDate,
        ),
      state: 'complete',
    },
  ];

  if (stored.deliveryDate) {
    items.push({
      id: 'delivery',
      label: 'Delivered',
      detail:
        'Delivery date used as the return-window basis.',
      dateLabel:
        formatDateOnly(
          stored.deliveryDate,
        ),
      state: 'complete',
    });
  }

  if (stored.returnDeadline) {
    items.push({
      id: 'return',
      label: 'Return deadline',
      detail:
        stored.lifecycleStatus ===
        'kept'
          ? 'Return tracking was closed when this purchase was marked as kept.'
          : 'Calculated from the detected return window and the saved purchase details.',
      dateLabel:
        formatDateOnly(
          stored.returnDeadline,
        ),
      state:
        stored.lifecycleStatus ===
        'kept'
          ? 'neutral'
          : timelineStateForDate(
              stored.returnDeadline,
            ),
    });
  }

  if (stored.warrantyDeadline) {
    items.push({
      id: 'warranty',
      label: 'Warranty expiry',
      detail:
        'Calculated from the detected warranty duration.',
      dateLabel:
        formatDateOnly(
          stored.warrantyDeadline,
        ),
      state:
        timelineStateForDate(
          stored.warrantyDeadline,
        ),
    });
  }

  if (stored.renewalDeadline) {
    items.push({
      id: 'renewal',
      label: 'Renewal date',
      detail:
        'Calculated from the detected renewal interval.',
      dateLabel:
        formatDateOnly(
          stored.renewalDeadline,
        ),
      state:
        timelineStateForDate(
          stored.renewalDeadline,
        ),
    });
  }

  if (
    stored.lifecycleStatus !==
      'active'
  ) {
    items.push({
      id: 'lifecycle',
      label:
        lifecycleLabels[
          stored.lifecycleStatus
        ],
      detail:
        stored.lifecycleStatus ===
        'kept'
          ? 'You marked this purchase as kept.'
          : stored.lifecycleStatus ===
              'returned'
            ? 'You marked this purchase as returned.'
            : 'You marked this purchase as refunded.',
      dateLabel:
        stored.lifecycleUpdatedAtIso
          ? formatIsoDate(
              stored.lifecycleUpdatedAtIso,
            )
          : null,
      state: 'complete',
    });
  }

  return items;
};

const hydrate = (
  stored: StoredProtectedPurchase,
): ProtectedPurchase => {
  const nextDeadline =
    getNextDeadline(stored);

  const remaining =
    nextDeadline
      ? daysUntil(
          nextDeadline.date,
        )
      : null;

  return {
    id:
      stored.id,
    sourceScanId:
      stored.sourceScanId,
    merchant:
      stored.merchant,
    domain:
      stored.domain,
    product:
      stored.product,
    amount:
      stored.amount,
    currency:
      stored.currency,
    amountLabel:
      stored.amountLabel,
    purchaseDate:
      stored.purchaseDate,
    deliveryDate:
      stored.deliveryDate,
    purchaseDateLabel:
      formatDateOnly(
        stored.purchaseDate,
      ),
    deliveryDateLabel:
      stored.deliveryDate
        ? formatDateOnly(
            stored.deliveryDate,
          )
        : null,
    returnDeadline:
      stored.returnDeadline,
    warrantyDeadline:
      stored.warrantyDeadline,
    renewalDeadline:
      stored.renewalDeadline,
    nextDeadlineIso:
      nextDeadline?.date ??
      null,
    nextDeadlineLabel:
      formatNextDeadline(
        nextDeadline,
        stored.lifecycleStatus,
      ),
    deadlineCount:
      getDeadlineEntries(
        stored,
      ).length,
    lifecycleStatus:
      stored.lifecycleStatus,
    lifecycleLabel:
      lifecycleLabels[
        stored.lifecycleStatus
      ],
    lifecycleUpdatedLabel:
      stored.lifecycleUpdatedAtIso
        ? formatIsoDate(
            stored.lifecycleUpdatedAtIso,
          )
        : null,
    evidenceSnapshot:
      stored.evidenceSnapshot,
    timeline:
      buildTimeline(
        stored,
      ),
    status:
      stored.lifecycleStatus ===
        'active' &&
      remaining !== null &&
      remaining <= 7
        ? 'attention'
        : 'protected',
  };
};

const readStored = (): StoredProtectedPurchase[] => {
  try {
    const raw =
      window.localStorage.getItem(
        STORAGE_KEY,
      );

    if (!raw) {
      return [];
    }

    const parsed =
      JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap(
      (value) => {
        const normalized =
          normalizeStoredPurchase(
            value,
          );

        return normalized
          ? [normalized]
          : [];
      },
    );
  } catch {
    return [];
  }
};

const writeStored = (
  purchases:
    StoredProtectedPurchase[],
): void => {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        purchases,
      ),
    );
  } catch {
    throw new Error(
      'Backstop could not save protection data on this device.',
    );
  }
};

const validateProtectionInput = (
  input: ProtectionInput,
): void => {
  if (!isDateOnly(input.purchaseDate)) {
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
};

const buildDeadlinesFromTerms = (
  terms: StoredProtectionTerms,
  input: ProtectionInput,
): Pick<
  StoredProtectedPurchase,
  | 'returnDeadline'
  | 'warrantyDeadline'
  | 'renewalDeadline'
> => {
  validateProtectionInput(
    input,
  );

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
  scan: PurchaseScan,
): StoredProtectionTerms => ({
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
  scan: PurchaseScan,
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
    buildDeadlinesFromTerms(
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
        purchase.amount !== null &&
        purchase.currency !== null,
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
    withValues[0].currency;

  const total =
    withValues.reduce(
      (sum, purchase) =>
        sum +
        purchase.amount,
      0,
    );

  return new Intl.NumberFormat(
    'en-MT',
    {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    },
  ).format(total);
};

const sortHydrated = (
  purchases:
    ProtectedPurchase[],
): ProtectedPurchase[] =>
  purchases.sort(
    (left, right) => {
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

export const getDashboardMetrics = (
  purchases:
    ProtectedPurchase[],
): DashboardMetric[] => [
  {
    id: 'protected',
    label:
      'Purchases protected',
    value:
      String(
        purchases.length,
      ),
    icon: 'shield',
  },
  {
    id: 'value',
    label:
      'Value monitored',
    value:
      formatMonitoredValue(
        purchases,
      ),
    icon: 'value',
  },
  {
    id: 'deadlines',
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
    icon: 'deadline',
  },
  {
    id: 'attention',
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
    icon: 'attention',
  },
];

export const protectionService = {
  list(): ProtectedPurchase[] {
    return sortHydrated(
      readStored().map(
        hydrate,
      ),
    );
  },

  get(
    id: string,
  ): ProtectedPurchase | null {
    const stored =
      readStored().find(
        (purchase) =>
          purchase.id === id,
      );

    return stored
      ? hydrate(stored)
      : null;
  },

  protect(
    scan: PurchaseScan,
    input: ProtectionInput,
  ): ProtectedPurchase {
    const terms =
      termsFromScan(
        scan,
      );

    const deadlines =
      buildDeadlinesFromTerms(
        terms,
        input,
      );

    const stored =
      readStored();

    const existing =
      stored.find(
        (purchase) =>
          purchase.sourceScanId ===
          scan.id,
      );

    const record: StoredProtectedPurchase = {
      version: 2,
      id:
        existing?.id ??
        crypto.randomUUID(),
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
      ...deadlines,
      protectionTerms:
        terms,
      lifecycleStatus:
        existing?.lifecycleStatus ??
        'active',
      lifecycleUpdatedAtIso:
        existing?.lifecycleUpdatedAtIso ??
        null,
      evidenceSnapshot:
        snapshotFromScan(
          scan,
        ),
      createdAtIso:
        existing?.createdAtIso ??
        new Date().toISOString(),
    };

    const next =
      existing
        ? stored.map(
            (purchase) =>
              purchase.id ===
              existing.id
                ? record
                : purchase,
          )
        : [
            record,
            ...stored,
          ];

    writeStored(next);

    return hydrate(record);
  },

  updateDates(
    id: string,
    input: ProtectionInput,
  ): ProtectedPurchase {
    const stored =
      readStored();

    const current =
      stored.find(
        (purchase) =>
          purchase.id === id,
      );

    if (!current) {
      throw new Error(
        'Protected purchase could not be found.',
      );
    }

    const deadlines =
      buildDeadlinesFromTerms(
        current.protectionTerms,
        input,
      );

    const updated: StoredProtectedPurchase = {
      ...current,
      purchaseDate:
        input.purchaseDate,
      deliveryDate:
        input.deliveryDate,
      ...deadlines,
    };

    writeStored(
      stored.map(
        (purchase) =>
          purchase.id === id
            ? updated
            : purchase,
      ),
    );

    return hydrate(updated);
  },

  setLifecycle(
    id: string,
    lifecycleStatus:
      PurchaseLifecycleStatus,
  ): ProtectedPurchase {
    const stored =
      readStored();

    const current =
      stored.find(
        (purchase) =>
          purchase.id === id,
      );

    if (!current) {
      throw new Error(
        'Protected purchase could not be found.',
      );
    }

    const updated: StoredProtectedPurchase = {
      ...current,
      lifecycleStatus,
      lifecycleUpdatedAtIso:
        lifecycleStatus ===
        'active'
          ? null
          : new Date().toISOString(),
    };

    writeStored(
      stored.map(
        (purchase) =>
          purchase.id === id
            ? updated
            : purchase,
      ),
    );

    return hydrate(updated);
  },

  remove(
    id: string,
  ): ProtectedPurchase[] {
    const next =
      readStored().filter(
        (purchase) =>
          purchase.id !== id,
      );

    writeStored(next);

    return sortHydrated(
      next.map(
        hydrate,
      ),
    );
  },
};
