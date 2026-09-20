import {
  Router,
} from 'express';

import {
  notificationRepository,
} from './notificationRepository';

const router =
  Router();

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
      const result =
        await notificationRepository.list(
          response.locals.clientId as string,
        );

      response.json(
        result,
      );
    } catch (error) {
      console.error(
        'Notification list error',
        error,
      );

      response
        .status(503)
        .json({
          error:
            'Backstop could not load deadline reminders.',
        });
    }
  },
);

router.patch(
  '/preferences',
  async (
    request,
    response,
  ) => {
    const leadDays =
      request.body?.leadDays;

    if (
      typeof leadDays !==
        'number' ||
      !Number.isInteger(
        leadDays,
      ) ||
      leadDays < 1 ||
      leadDays > 30
    ) {
      response
        .status(400)
        .json({
          error:
            'Reminder lead time must be between 1 and 30 days.',
        });

      return;
    }

    try {
      const preferences =
        await notificationRepository.updatePreferences(
          response.locals.clientId as string,
          leadDays,
        );

      response.json(
        preferences,
      );
    } catch (error) {
      console.error(
        'Notification preference update error',
        error,
      );

      response
        .status(503)
        .json({
          error:
            'Backstop could not update reminder settings.',
        });
    }
  },
);

router.patch(
  '/:id/read',
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
            'Invalid notification ID.',
        });

      return;
    }

    try {
      const updated =
        await notificationRepository.markRead(
          response.locals.clientId as string,
          request.params.id,
        );

      if (!updated) {
        response
          .status(404)
          .json({
            error:
              'Notification not found.',
          });

        return;
      }

      response
        .status(204)
        .end();
    } catch (error) {
      console.error(
        'Notification read update error',
        error,
      );

      response
        .status(503)
        .json({
          error:
            'Backstop could not update this reminder.',
        });
    }
  },
);

router.patch(
  '/:id/delivered',
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
            'Invalid notification ID.',
        });

      return;
    }

    try {
      const updated =
        await notificationRepository.markDelivered(
          response.locals.clientId as string,
          request.params.id,
        );

      if (!updated) {
        response
          .status(404)
          .json({
            error:
              'Notification not found.',
          });

        return;
      }

      response
        .status(204)
        .end();
    } catch (error) {
      console.error(
        'Notification delivery update error',
        error,
      );

      response
        .status(503)
        .json({
          error:
            'Backstop could not update desktop-alert state.',
        });
    }
  },
);

router.post(
  '/read-all',
  async (
    _request,
    response,
  ) => {
    try {
      await notificationRepository.markAllRead(
        response.locals.clientId as string,
      );

      response
        .status(204)
        .end();
    } catch (error) {
      console.error(
        'Notification read-all error',
        error,
      );

      response
        .status(503)
        .json({
          error:
            'Backstop could not mark reminders as read.',
        });
    }
  },
);

export const notificationRouter =
  router;
