import {
  Router,
} from 'express';

import type {
  CreateProtectedPurchaseRequestDto,
  ImportProtectedPurchasesRequestDto,
  ProtectionEvidenceSnapshot,
  ProtectionTermsDto,
  PurchaseLifecycleStatus,
  UpdateProtectedPurchaseDatesRequestDto,
} from '../src/types/purchase';

import {
  notificationRepository,
} from './notificationRepository';

import {
  isDateOnly,
} from './protectionDates';

import {
  protectionRepository,
} from './protectionRepository';

const router =
  Router();

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const asRecord = (
  value: unknown,
): Record<string, unknown> | null =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const nullableString = (
  value: unknown,
): value is string | null =>
  value === null ||
  typeof value === 'string';

const nullableNumber = (
  value: unknown,
): value is number | null =>
  value === null ||
  (
    typeof value === 'number' &&
    Number.isFinite(value)
  );

const readClientId = (
  value: unknown,
): string | null => {
  if (
    typeof value !== 'string'
  ) {
    return null;
  }

  const trimmed =
    value.trim();

  return uuidPattern.test(
    trimmed,
  )
    ? trimmed
    : null;
};

const parseProtectionTerms = (
  value: unknown,
): ProtectionTermsDto | null => {
  const record =
    asRecord(value);

  if (!record) {
    return null;
  }

  if (
    !nullableNumber(
      record.returnWindowDays,
    ) ||
    !nullableNumber(
      record.warrantyMonths,
    ) ||
    !nullableNumber(
      record.renewalAmount,
    ) ||
    !nullableString(
      record.renewalInterval,
    )
  ) {
    return null;
  }

  return {
    returnWindowDays:
      record.returnWindowDays,
    warrantyMonths:
      record.warrantyMonths,
    renewalAmount:
      record.renewalAmount,
    renewalInterval:
      record.renewalInterval,
  };
};

const parseEvidenceSnapshot = (
  value: unknown,
): ProtectionEvidenceSnapshot | null => {
  const record =
    asRecord(value);

  if (!record) {
    return null;
  }

  if (
    typeof record.risk !== 'number' ||
    !Number.isFinite(
      record.risk,
    ) ||
    typeof record.verdict !== 'string' ||
    typeof record.evidenceCoverage !== 'number' ||
    !Number.isFinite(
      record.evidenceCoverage,
    ) ||
    typeof record.scannedAtLabel !== 'string' ||
    !Array.isArray(
      record.findings,
    )
  ) {
    return null;
  }

  return value as ProtectionEvidenceSnapshot;
};

const parseCreateRequest = (
  value: unknown,
): CreateProtectedPurchaseRequestDto | null => {
  const record =
    asRecord(value);

  if (!record) {
    return null;
  }

  const terms =
    parseProtectionTerms(
      record.protectionTerms,
    );

  const evidence =
    parseEvidenceSnapshot(
      record.evidenceSnapshot,
    );

  if (
    typeof record.sourceScanId !== 'string' ||
    typeof record.merchant !== 'string' ||
    typeof record.domain !== 'string' ||
    typeof record.product !== 'string' ||
    !nullableNumber(
      record.amount,
    ) ||
    !nullableString(
      record.currency,
    ) ||
    typeof record.amountLabel !== 'string' ||
    !isDateOnly(
      record.purchaseDate,
    ) ||
    !(
      record.deliveryDate === null ||
      isDateOnly(
        record.deliveryDate,
      )
    ) ||
    !terms ||
    !evidence
  ) {
    return null;
  }

  return {
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
    protectionTerms:
      terms,
    evidenceSnapshot:
      evidence,
  };
};

const parseDatesRequest = (
  value: unknown,
): UpdateProtectedPurchaseDatesRequestDto | null => {
  const record =
    asRecord(value);

  if (
    !record ||
    !isDateOnly(
      record.purchaseDate,
    ) ||
    !(
      record.deliveryDate === null ||
      isDateOnly(
        record.deliveryDate,
      )
    )
  ) {
    return null;
  }

  return {
    purchaseDate:
      record.purchaseDate,
    deliveryDate:
      record.deliveryDate,
  };
};

const isLifecycleStatus = (
  value: unknown,
): value is PurchaseLifecycleStatus =>
  value === 'active' ||
  value === 'kept' ||
  value === 'returned' ||
  value === 'refunded';

router.use(
  (request, response, next) => {
    const clientId =
      readClientId(
        request.header(
          'x-backstop-client-id',
        ),
      );

    if (!clientId) {
      response
        .status(400)
        .json({
          error:
            'A valid Backstop client ID is required.',
        });

      return;
    }

    response.locals.clientId =
      clientId;

    next();
  },
);

router.get(
  '/',
  async (
    _request,
    response,
  ) => {
    try {
      const records =
        await protectionRepository.list(
          response.locals.clientId as string,
        );

      response.json({
        records,
      });
    } catch (error) {
      console.error(
        'Protection list error',
        error,
      );

      response
        .status(503)
        .json({
          error:
            'Backstop could not reach the local protection database.',
        });
    }
  },
);

router.post(
  '/',
  async (
    request,
    response,
  ) => {
    const input =
      parseCreateRequest(
        request.body,
      );

    if (!input) {
      response
        .status(400)
        .json({
          error:
            'The protection payload is invalid.',
        });

      return;
    }

    try {
      const record =
        await protectionRepository.create(
          response.locals.clientId as string,
          input,
        );

      response
        .status(201)
        .json(record);
    } catch (error) {
      response
        .status(400)
        .json({
          error:
            error instanceof Error
              ? error.message
              : 'Backstop could not save this protection record.',
        });
    }
  },
);

router.patch(
  '/:id/dates',
  async (
    request,
    response,
  ) => {
    if (
      !uuidPattern.test(
        request.params.id,
      )
    ) {
      response
        .status(400)
        .json({
          error:
            'Invalid protected purchase ID.',
        });

      return;
    }

    const input =
      parseDatesRequest(
        request.body,
      );

    if (!input) {
      response
        .status(400)
        .json({
          error:
            'The purchase dates are invalid.',
        });

      return;
    }

    try {
      const record =
        await protectionRepository.updateDates(
          response.locals.clientId as string,
          request.params.id,
          input,
        );

      if (!record) {
        response
          .status(404)
          .json({
            error:
              'Protected purchase not found.',
          });

        return;
      }

      await notificationRepository.invalidatePurchase(
        response.locals.clientId as string,
        request.params.id,
      );

      response.json(
        record,
      );
    } catch (error) {
      response
        .status(400)
        .json({
          error:
            error instanceof Error
              ? error.message
              : 'Backstop could not update the purchase dates.',
        });
    }
  },
);

router.patch(
  '/:id/lifecycle',
  async (
    request,
    response,
  ) => {
    if (
      !uuidPattern.test(
        request.params.id,
      )
    ) {
      response
        .status(400)
        .json({
          error:
            'Invalid protected purchase ID.',
        });

      return;
    }

    const recordBody =
      asRecord(
        request.body,
      );

    const lifecycleStatus =
      recordBody?.lifecycleStatus;

    if (
      !isLifecycleStatus(
        lifecycleStatus,
      )
    ) {
      response
        .status(400)
        .json({
          error:
            'Invalid purchase lifecycle status.',
        });

      return;
    }

    try {
      const record =
        await protectionRepository.setLifecycle(
          response.locals.clientId as string,
          request.params.id,
          lifecycleStatus,
        );

      if (!record) {
        response
          .status(404)
          .json({
            error:
              'Protected purchase not found.',
          });

        return;
      }

      await notificationRepository.invalidatePurchase(
        response.locals.clientId as string,
        request.params.id,
      );

      response.json(
        record,
      );
    } catch (error) {
      console.error(
        'Protection lifecycle update error',
        error,
      );

      response
        .status(503)
        .json({
          error:
            'Backstop could not update the purchase status.',
        });
    }
  },
);

router.delete(
  '/:id',
  async (
    request,
    response,
  ) => {
    if (
      !uuidPattern.test(
        request.params.id,
      )
    ) {
      response
        .status(400)
        .json({
          error:
            'Invalid protected purchase ID.',
        });

      return;
    }

    try {
      const removed =
        await protectionRepository.remove(
          response.locals.clientId as string,
          request.params.id,
        );

      if (!removed) {
        response
          .status(404)
          .json({
            error:
              'Protected purchase not found.',
          });

        return;
      }

      response.status(
        204,
      ).end();
    } catch (error) {
      console.error(
        'Protection delete error',
        error,
      );

      response
        .status(503)
        .json({
          error:
            'Backstop could not remove this protected purchase.',
        });
    }
  },
);

router.post(
  '/import',
  async (
    request,
    response,
  ) => {
    const body =
      asRecord(
        request.body,
      );

    const records =
      body?.records;

    if (
      !Array.isArray(
        records,
      ) ||
      records.length > 100
    ) {
      response
        .status(400)
        .json({
          error:
            'The protection import payload is invalid.',
        });

      return;
    }

    try {
      await protectionRepository.importRecords(
        response.locals.clientId as string,
        records as ImportProtectedPurchasesRequestDto['records'],
      );

      response
        .status(204)
        .end();
    } catch (error) {
      console.error(
        'Protection import error',
        error,
      );

      response
        .status(503)
        .json({
          error:
            'Backstop could not import existing local protection records.',
        });
    }
  },
);

export const protectionRouter =
  router;
