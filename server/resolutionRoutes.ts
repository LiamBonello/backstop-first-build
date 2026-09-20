import {
  Router,
} from 'express';

import type {
  CreateResolutionCaseRequestDto,
  ResolutionCaseStatus,
  ResolutionIssueType,
} from '../src/types/resolution';

import {
  resolutionRepository,
} from './resolutionRepository';

const router =
  Router();

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const issueTypes:
  ResolutionIssueType[] = [
    'return_refused',
    'refund_overdue',
    'merchant_unresponsive',
    'unexpected_renewal',
    'warranty_problem',
    'item_not_as_described',
    'other',
  ];

const statuses:
  ResolutionCaseStatus[] = [
    'draft',
    'merchant_contacted',
    'awaiting_response',
    'escalated',
    'refund_promised',
    'resolved',
    'closed',
  ];

const readClientId = (
  value: unknown,
): string | null => {
  if (
    typeof value !==
      'string'
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

const isIssueType = (
  value: unknown,
): value is ResolutionIssueType =>
  typeof value ===
    'string' &&
  issueTypes.includes(
    value as ResolutionIssueType,
  );

const isStatus = (
  value: unknown,
): value is ResolutionCaseStatus =>
  typeof value ===
    'string' &&
  statuses.includes(
    value as ResolutionCaseStatus,
  );

const nullableAmount = (
  value: unknown,
): value is number | null =>
  value === null ||
  (
    typeof value ===
      'number' &&
    Number.isFinite(
      value,
    ) &&
    value >= 0
  );

router.use(
  (
    request,
    response,
    next,
  ) => {
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
      const cases =
        await resolutionRepository.list(
          response.locals.clientId as string,
        );

      response.json({
        cases,
      });
    } catch (error) {
      console.error(
        'Resolution case list error',
        error,
      );

      response
        .status(503)
        .json({
          error:
            'Backstop could not load resolution cases.',
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
    const body =
      (
        request.body ??
        {}
      ) as Partial<
        CreateResolutionCaseRequestDto
      >;

    const {
      purchaseId,
      issueType,
      amountInDispute,
      currency,
      desiredOutcome,
      initialNote,
    } =
      body;

    if (
      typeof purchaseId !==
        'string' ||
      !uuidPattern.test(
        purchaseId,
      ) ||
      !isIssueType(
        issueType,
      ) ||
      !nullableAmount(
        amountInDispute,
      ) ||
      !(
        currency ===
          null ||
        (
          typeof currency ===
            'string' &&
          currency.length >= 3 &&
          currency.length <= 8
        )
      ) ||
      typeof desiredOutcome !==
        'string' ||
      desiredOutcome.trim().length <
        3 ||
      desiredOutcome.trim().length >
        500 ||
      !(
        initialNote ===
          null ||
        (
          typeof initialNote ===
            'string' &&
          initialNote.trim().length <=
            2000
        )
      )
    ) {
      response
        .status(400)
        .json({
          error:
            'The resolution case details are invalid.',
        });

      return;
    }

    try {
      const created =
        await resolutionRepository.create(
          response.locals.clientId as string,
          {
            purchaseId,
            issueType,
            amountInDispute,
            currency:
              currency?.toUpperCase() ??
              null,
            desiredOutcome:
              desiredOutcome.trim(),
            initialNote:
              initialNote?.trim() ||
              null,
          },
        );

      if (!created) {
        response
          .status(404)
          .json({
            error:
              'Protected purchase not found.',
          });

        return;
      }

      response
        .status(201)
        .json(created);
    } catch (error) {
      console.error(
        'Resolution case create error',
        error,
      );

      response
        .status(503)
        .json({
          error:
            'Backstop could not create this resolution case.',
        });
    }
  },
);

router.patch(
  '/:id/status',
  async (
    request,
    response,
  ) => {
    const status =
      request.body?.status;

    if (
      !uuidPattern.test(
        request.params.id,
      ) ||
      !isStatus(
        status,
      )
    ) {
      response
        .status(400)
        .json({
          error:
            'The case status is invalid.',
        });

      return;
    }

    try {
      const updated =
        await resolutionRepository.setStatus(
          response.locals.clientId as string,
          request.params.id,
          status,
        );

      if (!updated) {
        response
          .status(404)
          .json({
            error:
              'Resolution case not found.',
          });

        return;
      }

      response.json(
        updated,
      );
    } catch (error) {
      console.error(
        'Resolution case status error',
        error,
      );

      response
        .status(503)
        .json({
          error:
            'Backstop could not update the case status.',
        });
    }
  },
);

router.post(
  '/:id/notes',
  async (
    request,
    response,
  ) => {
    const note =
      request.body?.note;

    if (
      !uuidPattern.test(
        request.params.id,
      ) ||
      typeof note !==
        'string' ||
      note.trim().length <
        1 ||
      note.trim().length >
        2000
    ) {
      response
        .status(400)
        .json({
          error:
            'Enter a case note of up to 2,000 characters.',
        });

      return;
    }

    try {
      const updated =
        await resolutionRepository.addNote(
          response.locals.clientId as string,
          request.params.id,
          note.trim(),
        );

      if (!updated) {
        response
          .status(404)
          .json({
            error:
              'Resolution case not found.',
          });

        return;
      }

      response.json(
        updated,
      );
    } catch (error) {
      console.error(
        'Resolution case note error',
        error,
      );

      response
        .status(503)
        .json({
          error:
            'Backstop could not save the case note.',
        });
    }
  },
);

export const resolutionRouter =
  router;
