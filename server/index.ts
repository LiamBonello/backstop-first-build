import express from 'express';
import { checkDatabaseConnection } from './db/pool';
import { notificationRouter } from './notificationRoutes';
import { protectionRouter } from './protectionRoutes';
import { analyzeUrl } from './scanner';
import { ScannerError } from './scannerError';

try {
  process.loadEnvFile('.env');
} catch {
  // Local development does not require a .env file.
}

const app = express();

const port = Number(
  process.env.PORT ?? 8787,
);

app.disable('x-powered-by');

app.use(
  express.json({
    limit: '512kb',
  }),
);

app.get(
  '/api/health',
  async (
    _request,
    response,
  ) => {
    const databaseConnected =
      await checkDatabaseConnection();

    response.json({
      ok: true,
      service:
        'backstop-api',
      databaseConnected,
    });
  },
);

app.use(
  '/api/protection',
  protectionRouter,
);

app.use(
  '/api/notifications',
  notificationRouter,
);

app.post(
  '/api/scan',
  async (
    request,
    response,
  ) => {
    const url =
      typeof request.body?.url ===
      'string'
        ? request.body.url.trim()
        : '';

    if (!url) {
      response
        .status(400)
        .json({
          error:
            'A URL is required.',
        });

      return;
    }

    try {
      const result =
        await analyzeUrl(url);

      response.json(result);
    } catch (error) {
      if (
        error instanceof
        ScannerError
      ) {
        response
          .status(
            error.statusCode,
          )
          .json({
            error:
              error.message,
          });

        return;
      }

      console.error(
        'Unexpected scanner error',
        error,
      );

      response
        .status(500)
        .json({
          error:
            'Backstop hit an unexpected scanner error.',
        });
    }
  },
);

app.listen(
  port,
  () => {
    console.log(
      `Backstop scanner listening on http://localhost:${port}`,
    );
  },
);