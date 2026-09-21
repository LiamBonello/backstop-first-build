import {
  randomUUID,
} from 'node:crypto';

import type {
  RequestHandler,
} from 'express';

export const requestLoggingMiddleware:
  RequestHandler =
  (
    request,
    response,
    next,
  ) => {
    const requestId =
      randomUUID();

    const startedAt =
      process.hrtime.bigint();

    response.setHeader(
      'X-Request-Id',
      requestId,
    );

    response.on(
      'finish',
      () => {
        const elapsedNs =
          process.hrtime.bigint() -
          startedAt;

        const durationMs =
          Number(
            elapsedNs,
          ) /
          1_000_000;

        const payload = {
          type:
            'http_request',
          requestId,
          method:
            request.method,
          path:
            request.path,
          status:
            response.statusCode,
          durationMs:
            Math.round(
              durationMs *
                10,
            ) /
            10,
        };

        console.log(
          JSON.stringify(
            payload,
          ),
        );
      },
    );

    next();
  };
