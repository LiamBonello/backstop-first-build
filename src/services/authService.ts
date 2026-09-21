import {
  createInternalNeonAuth,
} from '@neondatabase/auth';

export interface BackstopAuthUser {
  id: string;
  name: string | null;
  email: string;
}

const authUrl =
  (
    import.meta.env
      .VITE_NEON_AUTH_URL ??
    ''
  ).trim();

const internalAuth =
  authUrl
    ? createInternalNeonAuth(
        authUrl,
      )
    : null;

const client =
  internalAuth?.adapter ??
  null;

const mapUser = (
  user: {
    id: string;
    name?: string | null;
    email: string;
  },
): BackstopAuthUser => ({
  id:
    user.id,
  name:
    user.name ??
    null,
  email:
    user.email,
});

const requireClient =
  () => {
    if (!client) {
      throw new Error(
        'Backstop authentication is not configured for this environment.',
      );
    }

    return client;
  };

const resultErrorMessage = (
  value: unknown,
  fallback: string,
): string => {
  if (
    typeof value ===
      'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message ===
      'string'
  ) {
    return value.message;
  }

  return fallback;
};

const getCurrentUser =
  async (): Promise<
    BackstopAuthUser | null
  > => {
    if (!client) {
      return null;
    }

    const result =
      await client.getSession();

    if (
      result.error
    ) {
      throw new Error(
        resultErrorMessage(
          result.error,
          'Backstop could not load your session.',
        ),
      );
    }

    const user =
      result.data?.user;

    return user
      ? mapUser(
          user,
        )
      : null;
  };

export const authService = {
  isConfigured():
    boolean {
    return Boolean(
      client &&
      internalAuth,
    );
  },

  getCurrentUser,

  async signIn(
    email: string,
    password: string,
  ): Promise<
    BackstopAuthUser
  > {
    const authClient =
      requireClient();

    const result =
      await authClient.signIn.email({
        email,
        password,
      });

    if (
      result.error
    ) {
      throw new Error(
        resultErrorMessage(
          result.error,
          'Sign in failed.',
        ),
      );
    }

    const user =
      await getCurrentUser();

    if (!user) {
      throw new Error(
        'Backstop signed in but could not load the account session.',
      );
    }

    return user;
  },

  async signUp(
    name: string,
    email: string,
    password: string,
  ): Promise<
    BackstopAuthUser
  > {
    const authClient =
      requireClient();

    const result =
      await authClient.signUp.email({
        name,
        email,
        password,
      });

    if (
      result.error
    ) {
      throw new Error(
        resultErrorMessage(
          result.error,
          'Account creation failed.',
        ),
      );
    }

    const user =
      await getCurrentUser();

    if (!user) {
      throw new Error(
        'Backstop created the account but could not load the account session.',
      );
    }

    return user;
  },

  async signOut():
    Promise<void> {
    if (!client) {
      return;
    }

    const result =
      await client.signOut();

    if (
      result.error
    ) {
      throw new Error(
        resultErrorMessage(
          result.error,
          'Sign out failed.',
        ),
      );
    }
  },

  async getAccessToken():
    Promise<
      string | null
    > {
    if (
      !internalAuth
    ) {
      return null;
    }

    return await internalAuth.getJWTToken();
  },
};
