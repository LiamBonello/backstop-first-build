import type {
  DeadlineNotification,
  DeadlineNotificationKind,
  RawDeadlineNotificationDto,
} from '../types/notification';

const kindLabels: Record<
  DeadlineNotificationKind,
  string
> = {
  return:
    'Return window',
  warranty:
    'Warranty',
  renewal:
    'Renewal',
};

const todayDateValue = (): string => {
  const today =
    new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() + 1,
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

const dateOnlyToUtcMs = (
  value: string,
): number => {
  const [
    year,
    month,
    day,
  ] = value
    .split('-')
    .map(Number);

  return Date.UTC(
    year,
    month - 1,
    day,
  );
};

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

const buildTitle = (
  kind:
    DeadlineNotificationKind,
  remaining:
    number,
): string => {
  const label =
    kindLabels[
      kind
    ];

  if (
    remaining <= 0
  ) {
    return `${label} is due today`;
  }

  if (
    remaining === 1
  ) {
    return `${label} is due tomorrow`;
  }

  return `${label} closes in ${remaining} days`;
};

export const mapDeadlineNotification = (
  raw:
    RawDeadlineNotificationDto,
): DeadlineNotification => {
  const remaining =
    Math.max(
      0,
      daysUntil(
        raw.deadlineDate,
      ),
    );

  return {
    id:
      raw.id,
    purchaseId:
      raw.purchaseId,
    kind:
      raw.deadlineKind,
    title:
      buildTitle(
        raw.deadlineKind,
        remaining,
      ),
    detail:
      `${raw.product} · ${raw.merchant}`,
    deadlineLabel:
      formatDateOnly(
        raw.deadlineDate,
      ),
    daysRemaining:
      remaining,
    unread:
      raw.readAtIso ===
      null,
    delivered:
      raw.deliveredAtIso !==
      null,
  };
};
