import type {
  Request,
  RequestHandler,
} from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
  keyPrefix: string;
  key?: (
    request: Request,
  ) => string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export const createRateLimiter = ({
  windowMs,
  max,
  message,
  keyPrefix,
  key,
}: RateLimitOptions): RequestHandler => {
  const entries =
    new Map<
      string,
      RateLimitEntry
    >();

  let requestsSincePrune =
    0;

  return (
    request,
    response,
    next,
  ) => {
    const now =
      Date.now();

    requestsSincePrune +=
      1;

    if (
      requestsSincePrune >=
      500
    ) {
      requestsSincePrune =
        0;

      for (
        const [
          entryKey,
          entry,
        ] of entries
      ) {
        if (
          entry.resetAt <=
          now
        ) {
          entries.delete(
            entryKey,
          );
        }
      }
    }

    const rawKey =
      key?.(
        request,
      ) ??
      request.ip ??
      request.socket.remoteAddress ??
      'unknown';

    const entryKey =
      `${keyPrefix}:${rawKey}`;

    const existing =
      entries.get(
        entryKey,
      );

    const current =
      !existing ||
      existing.resetAt <=
        now
        ? {
            count:
              0,
            resetAt:
              now +
              windowMs,
          }
        : existing;

    current.count +=
      1;

    entries.set(
      entryKey,
      current,
    );

    const remaining =
      Math.max(
        0,
        max -
          current.count,
      );

    const resetSeconds =
      Math.max(
        1,
        Math.ceil(
          (
            current.resetAt -
            now
          ) /
            1000,
        ),
      );

    response.setHeader(
      'RateLimit-Limit',
      String(
        max,
      ),
    );

    response.setHeader(
      'RateLimit-Remaining',
      String(
        remaining,
      ),
    );

    response.setHeader(
      'RateLimit-Reset',
      String(
        resetSeconds,
      ),
    );

    if (
      current.count >
      max
    ) {
      response.setHeader(
        'Retry-After',
        String(
          resetSeconds,
        ),
      );

      response
        .status(429)
        .json({
          error:
            message,
        });

      return;
    }

    next();
  };
};
