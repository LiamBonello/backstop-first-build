import {
  Router,
} from 'express';

import {
  accountRepository,
} from './accountRepository';

import {
  requireAuthenticatedUser,
} from './authMiddleware';

const router =
  Router();

router.use(
  requireAuthenticatedUser,
);

router.get(
  '/export',
  async (
    _request,
    response,
  ) => {
    try {
      const userId =
        response.locals.userId as string;

      const data =
        await accountRepository.exportData(
          userId,
        );

      if (!data) {
        response
          .status(404)
          .json({
            error:
              'Backstop account not found.',
          });

        return;
      }

      const exportDate =
        data.exportedAtIso.slice(
          0,
          10,
        );

      response.setHeader(
        'Cache-Control',
        'no-store',
      );

      response.setHeader(
        'Content-Disposition',
        `attachment; filename="backstop-data-${exportDate}.json"`,
      );

      response.json(
        data,
      );
    } catch (error) {
      console.error(
        'Account export error',
        error,
      );

      response
        .status(503)
        .json({
          error:
            'Backstop could not prepare your data export.',
        });
    }
  },
);

router.delete(
  '/',
  async (
    request,
    response,
  ) => {
    const confirmation =
      request.body?.confirmation;

    if (
      confirmation !==
      'DELETE'
    ) {
      response
        .status(400)
        .json({
          error:
            'Type DELETE to confirm permanent account deletion.',
        });

      return;
    }

    try {
      const deleted =
        await accountRepository.deleteAccount(
          response.locals.userId as string,
        );

      if (!deleted) {
        response
          .status(404)
          .json({
            error:
              'Backstop account not found.',
          });

        return;
      }

      response
        .status(204)
        .end();
    } catch (error) {
      console.error(
        'Account deletion error',
        error,
      );

      response
        .status(503)
        .json({
          error:
            'Backstop could not delete your account.',
        });
    }
  },
);

export const accountRouter =
  router;
