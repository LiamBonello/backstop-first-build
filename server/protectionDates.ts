import type {
  ProtectionInput,
  ProtectionTermsDto,
} from '../src/types/purchase';

export interface ProtectionDeadlines {
  returnDeadline: string | null;
  warrantyDeadline: string | null;
  renewalDeadline: string | null;
}

export const isDateOnly = (
  value: unknown,
): value is string =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value);

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
  ] = value
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
  } = parseDateOnlyParts(
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
    .slice(0, 10);

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
  } = parseDateOnlyParts(
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

export const validateProtectionInput = (
  input: ProtectionInput,
): void => {
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
};

export const calculateProtectionDeadlines = (
  terms: ProtectionTermsDto,
  input: ProtectionInput,
): ProtectionDeadlines => {
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
