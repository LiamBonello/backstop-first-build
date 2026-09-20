import type {
  DashboardMetric,
  ProtectedPurchase,
  ProtectionInput,
  PurchaseScan,
} from '../types/purchase';

const STORAGE_KEY = 'backstop.protected-purchases.v1';

interface StoredProtectedPurchase {
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

interface DeadlineEntry {
  kind: 'Return' | 'Warranty' | 'Renewal';
  date: string;
}

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

const isStoredProtectedPurchase = (
  value: unknown,
): value is StoredProtectedPurchase => {
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

  const targetFirst = new Date(
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

const daysUntil = (
  value: string,
): number =>
  Math.round(
    (
      dateOnlyToUtcMs(value) -
      dateOnlyToUtcMs(todayDateValue())
    ) /
      (24 * 60 * 60 * 1000),
  );

const getDeadlineEntries = (
  purchase:
    Pick<
      StoredProtectedPurchase,
      | 'returnDeadline'
      | 'warrantyDeadline'
      | 'renewalDeadline'
    >,
): DeadlineEntry[] => {
  const entries: DeadlineEntry[] = [];

  if (purchase.returnDeadline) {
    entries.push({
      kind: 'Return',
      date: purchase.returnDeadline,
    });
  }

  if (purchase.warrantyDeadline) {
    entries.push({
      kind: 'Warranty',
      date: purchase.warrantyDeadline,
    });
  }

  if (purchase.renewalDeadline) {
    entries.push({
      kind: 'Renewal',
      date: purchase.renewalDeadline,
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
    >,
): DeadlineEntry | null =>
  getDeadlineEntries(purchase)
    .filter(
      (entry) =>
        daysUntil(entry.date) >= 0,
    )
    .sort(
      (left, right) =>
        left.date.localeCompare(
          right.date,
        ),
    )[0] ?? null;

const formatNextDeadline = (
  entry: DeadlineEntry | null,
): string => {
  if (!entry) {
    return 'No upcoming exact deadline';
  }

  const remaining =
    daysUntil(entry.date);

  const relative =
    remaining === 0
      ? 'today'
      : remaining === 1
        ? 'tomorrow'
        : `in ${remaining} days`;

  return `${entry.kind} · ${formatDateOnly(entry.date)} (${relative})`;
};

const hydrate = (
  stored: StoredProtectedPurchase,
): ProtectedPurchase => {
  const nextDeadline =
    getNextDeadline(stored);

  const remaining =
    nextDeadline
      ? daysUntil(nextDeadline.date)
      : null;

  return {
    id: stored.id,
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
      nextDeadline?.date ?? null,
    nextDeadlineLabel:
      formatNextDeadline(
        nextDeadline,
      ),
    deadlineCount:
      getDeadlineEntries(
        stored,
      ).length,
    status:
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

    return Array.isArray(parsed)
      ? parsed.filter(
          isStoredProtectedPurchase,
        )
      : [];
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
      JSON.stringify(purchases),
    );
  } catch {
    throw new Error(
      'Backstop could not save protection data on this device.',
    );
  }
};

const buildDeadlines = (
  scan: PurchaseScan,
  input: ProtectionInput,
): Pick<
  StoredProtectedPurchase,
  | 'returnDeadline'
  | 'warrantyDeadline'
  | 'renewalDeadline'
> => {
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
      scan.protection
        .returnWindowDays !==
      null
        ? addDays(
            returnBasis,
            scan.protection
              .returnWindowDays,
          )
        : null,

    warrantyDeadline:
      scan.protection
        .warrantyMonths !==
      null
        ? addMonths(
            input.purchaseDate,
            scan.protection
              .warrantyMonths,
          )
        : null,

    renewalDeadline:
      scan.protection
        .renewalAmount !==
        null
        ? addRenewalInterval(
            input.purchaseDate,
            scan.protection
              .renewalInterval,
          )
        : null,
  };
};

export const calculateProtectionPreview = (
  scan: PurchaseScan,
  input: ProtectionInput,
) => {
  const deadlines =
    buildDeadlines(
      scan,
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
    return readStored()
      .map(hydrate)
      .sort(
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
  },

  protect(
    scan: PurchaseScan,
    input: ProtectionInput,
  ): ProtectedPurchase {
    const deadlines =
      buildDeadlines(
        scan,
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
      version: 1,
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

  remove(
    id: string,
  ): ProtectedPurchase[] {
    const next =
      readStored().filter(
        (purchase) =>
          purchase.id !== id,
      );

    writeStored(next);

    return next
      .map(hydrate)
      .sort(
        (left, right) =>
          (
            left.nextDeadlineIso ??
            '9999-12-31'
          ).localeCompare(
            right.nextDeadlineIso ??
            '9999-12-31',
          ),
      );
  },
};
