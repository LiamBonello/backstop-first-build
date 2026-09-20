const apiBaseUrl =
  (
    import.meta.env
      .VITE_API_BASE_URL ??
    ''
  ).replace(
    /\/$/,
    '',
  );

const CLIENT_ID_KEY =
  'backstop.client-id.v1';

export const getBackstopClientId =
  (): string => {
    const existing =
      window.localStorage.getItem(
        CLIENT_ID_KEY,
      );

    if (existing) {
      return existing;
    }

    const created =
      crypto.randomUUID();

    window.localStorage.setItem(
      CLIENT_ID_KEY,
      created,
    );

    return created;
  };

export const backstopRequestJson =
  async <T>(
    path: string,
    init?: RequestInit,
  ): Promise<T> => {
    const headers =
      new Headers(
        init?.headers,
      );

    headers.set(
      'content-type',
      'application/json',
    );

    headers.set(
      'x-backstop-client-id',
      getBackstopClientId(),
    );

    const response =
      await fetch(
        `${apiBaseUrl}${path}`,
        {
          ...init,
          headers,
        },
      );

    if (!response.ok) {
      let message =
        'Backstop could not complete that request.';

      try {
        const payload =
          await response.json() as {
            error?: unknown;
          };

        if (
          typeof payload.error ===
          'string'
        ) {
          message =
            payload.error;
        }
      } catch {
        // Some error responses may not contain JSON.
      }

      throw new Error(
        message,
      );
    }

    if (
      response.status === 204
    ) {
      return undefined as T;
    }

    return await response.json() as T;
  };
