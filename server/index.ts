import path from 'node:path';

import express from 'express';

import {
  accountRouter,
} from './accountRoutes';

import {
  checkDatabaseConnection,
} from './db/pool';

import {
  notificationRouter,
} from './notificationRoutes';

import {
  protectionRouter,
} from './protectionRoutes';

import {
  createRateLimiter,
} from './rateLimit';

import {
  requestLoggingMiddleware,
} from './requestLogging';

import {
  resolutionRouter,
} from './resolutionRoutes';

import {
  analyzeUrl,
} from './scanner';

import {
  ScannerError,
} from './scannerError';

try {
  process.loadEnvFile(
    '.env',
  );
} catch {
  // Local development does not require a .env file.
}

const app =
  express();

const port =
  Number(
    process.env.PORT ??
      8787,
  );

const isProduction =
  process.env.NODE_ENV ===
  'production';

const authUrl =
  (
    process.env
      .NEON_AUTH_URL ??
    process.env
      .VITE_NEON_AUTH_URL ??
    ''
  ).trim();

const authOrigin =
  (() => {
    if (!authUrl) {
      return null;
    }

    try {
      return new URL(
        authUrl,
      ).origin;
    } catch {
      return null;
    }
  })();

const scanRateLimiter =
  createRateLimiter({
    windowMs:
      10 *
      60 *
      1000,
    max:
      20,
    keyPrefix:
      'scan',
    message:
      'Too many scans from this connection. Try again in a few minutes.',
  });

const protectedApiRateLimiter =
  createRateLimiter({
    windowMs:
      5 *
      60 *
      1000,
    max:
      300,
    keyPrefix:
      'protected-api',
    message:
      'Too many Backstop requests from this connection. Try again shortly.',
  });

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
      'X-Frame-Options',
      'DENY',
    );

    response.setHeader(
      'Referrer-Policy',
      'strict-origin-when-cross-origin',
    );

    response.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()',
    );

    response.setHeader(
      'Cross-Origin-Opener-Policy',
      'same-origin',
    );

    response.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: https:",
        `connect-src 'self'${authOrigin ? ` ${authOrigin}` : ''}`,
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
        "form-action 'self'",
      ].join(
        '; ',
      ),
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
  '/api',
  requestLoggingMiddleware,
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

    const authConfigured =
      Boolean(
        authOrigin,
      );

    const ok =
      databaseConnected &&
      authConfigured;

    response
      .status(
        ok
          ? 200
          : 503,
      )
      .json({
        ok,
        service:
          'backstop-api',
        databaseConnected,
        authConfigured,
        uptimeSeconds:
          Math.round(
            process.uptime(),
          ),
        commit:
          process.env
            .RENDER_GIT_COMMIT
            ?.slice(
              0,
              12,
            ) ??
          null,
      });
  },
);

app.use(
  '/api/protection',
  protectedApiRateLimiter,
  protectionRouter,
);

app.use(
  '/api/notifications',
  protectedApiRateLimiter,
  notificationRouter,
);

app.use(
  '/api/resolution-cases',
  protectedApiRateLimiter,
  resolutionRouter,
);

app.use(
  '/api/account',
  protectedApiRateLimiter,
  accountRouter,
);

app.post(
  '/api/scan',
  scanRateLimiter,
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

      response.setHeader(
        'Cache-Control',
        'no-cache',
      );

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
      JSON.stringify({
        type:
          'service_start',
        service:
          'backstop-api',
        port,
        environment:
          process.env.NODE_ENV ??
          'development',
      }),
    );
  },
);
