import path from 'node:path';

import express from 'express';

import { checkDatabaseConnection } from './db/pool';
import { notificationRouter } from './notificationRoutes';
import { protectionRouter } from './protectionRoutes';
import { resolutionRouter } from './resolutionRoutes';
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

const isProduction =
  process.env.NODE_ENV ===
  'production';

const SCAN_RATE_LIMIT_WINDOW_MS =
  10 *
  60 *
  1000;

const SCAN_RATE_LIMIT_MAX =
  20;

interface ScanRateLimitEntry {
  count: number;
  resetAt: number;
}

const scanRateLimits =
  new Map<
    string,
    ScanRateLimitEntry
  >();

if (isProduction) {
  app.set(
    'trust proxy',
    1,
  );
}

app.disable(
  'x-powered-by',
);

app.use(
  (
    _request,
    response,
    next,
  ) => {
    response.setHeader(
      'X-Content-Type-Options',
      'nosniff',
    );

    response.setHeader(
      'Referrer-Policy',
      'strict-origin-when-cross-origin',
    );

    response.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );

    if (
      isProduction
    ) {
      response.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    }

    next();
  },
);

app.use(
  express.json({
    limit:
      '512kb',
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
      ok:
        true,
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

app.use(
  '/api/resolution-cases',
  resolutionRouter,
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
        .status(
          400,
        )
        .json({
          error:
            'A URL is required.',
        });

      return;
    }

    const clientKey =
      request.ip ??
      request.socket.remoteAddress ??
      'unknown';

    const now =
      Date.now();

    const currentLimit =
      scanRateLimits.get(
        clientKey,
      );

    if (
      !currentLimit ||
      currentLimit.resetAt <=
        now
    ) {
      scanRateLimits.set(
        clientKey,
        {
          count:
            1,
          resetAt:
            now +
            SCAN_RATE_LIMIT_WINDOW_MS,
        },
      );
    } else if (
      currentLimit.count >=
      SCAN_RATE_LIMIT_MAX
    ) {
      response.setHeader(
        'Retry-After',
        Math.max(
          1,
          Math.ceil(
            (
              currentLimit.resetAt -
              now
            ) /
              1000,
          ),
        ).toString(),
      );

      response
        .status(
          429,
        )
        .json({
          error:
            'Too many scans from this connection. Try again in a few minutes.',
        });

      return;
    } else {
      currentLimit.count +=
        1;
    }

    try {
      const result =
        await analyzeUrl(
          url,
        );

      response.json(
        result,
      );
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
        .status(
          500,
        )
        .json({
          error:
            'Backstop hit an unexpected scanner error.',
        });
    }
  },
);

app.use(
  '/api',
  (
    _request,
    response,
  ) => {
    response
      .status(
        404,
      )
      .json({
        error:
          'Backstop API route not found.',
      });
  },
);

if (
  isProduction
) {
  const distDirectory =
    path.resolve(
      process.cwd(),
      'dist',
    );

  app.use(
    express.static(
      distDirectory,
      {
        index:
          false,
        maxAge:
          '1h',
      },
    ),
  );

  app.use(
    (
      request,
      response,
      next,
    ) => {
      if (
        request.method !==
        'GET'
      ) {
        next();

        return;
      }

      response.sendFile(
        path.join(
          distDirectory,
          'index.html',
        ),
      );
    },
  );
}

app.listen(
  port,
  '0.0.0.0',
  () => {
    console.log(
      `Backstop listening on port ${port}`,
    );
  },
);
