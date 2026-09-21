import type {
  RequestHandler,
} from 'express';

import {
  createRemoteJWKSet,
  jwtVerify,
} from 'jose';

import {
  accountRepository,
} from './accountRepository';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const authUrl =
  (
    process.env
      .NEON_AUTH_URL ??
    process.env
      .VITE_NEON_AUTH_URL ??
    ''
  )
    .trim()
    .replace(
      /\/$/,
      '',
    );

const remoteJwks =
  authUrl
    ? createRemoteJWKSet(
        new URL(
          `${authUrl}/.well-known/jwks.json`,
        ),
      )
    : null;

const readBearerToken = (
  value:
    string | undefined,
): string | null => {
  if (!value) {
    return null;
  }

  const [
    scheme,
    token,
  ] =
    value.split(
      ' ',
    );

  if (
    scheme?.toLowerCase() !==
      'bearer' ||
    !token
  ) {
    return null;
  }

  return token;
};

export const requireAuthenticatedUser:
  RequestHandler =
  async (
    request,
    response,
    next,
  ) => {
    if (
      !remoteJwks
    ) {
      response
        .status(503)
        .json({
          error:
            'Backstop authentication is not configured on the server.',
        });

      return;
    }

    const token =
      readBearerToken(
        request.header(
          'authorization',
        ),
      );

    if (!token) {
      response
        .status(401)
        .json({
          error:
            'Sign in to access your protected purchases.',
        });

      return;
    }

    try {
      const {
        payload,
      } =
        await jwtVerify(
          token,
          remoteJwks,
        );

      const userId =
        payload.sub;

      if (
        typeof userId !==
          'string' ||
        !uuidPattern.test(
          userId,
        ) ||
        payload.role ===
          'anonymous'
      ) {
        response
          .status(401)
          .json({
            error:
              'Your Backstop session is invalid.',
          });

        return;
      }

      let activeUser =
        false;

      try {
        activeUser =
          await accountRepository.userExists(
            userId,
          );
      } catch (error) {
        console.error(
          JSON.stringify({
            type:
              'auth_user_lookup_error',
            message:
              error instanceof Error
                ? error.message
                : 'Unknown auth user lookup error',
          }),
        );

        response
          .status(503)
          .json({
            error:
              'Backstop could not verify your account right now.',
          });

        return;
      }

      if (!activeUser) {
        response
          .status(401)
          .json({
            error:
              'Your Backstop account is no longer active.',
          });

        return;
      }

      response.setHeader(
        'Cache-Control',
        'no-store',
      );

      response.locals.userId =
        userId;

      next();
    } catch {
      response
        .status(401)
        .json({
          error:
            'Your Backstop session has expired. Sign in again.',
        });
    }
  };
