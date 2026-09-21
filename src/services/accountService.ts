import {
  authService,
} from './authService';

import {
  backstopRequestJson,
} from './backstopApi';

export const accountService = {
  async downloadExport():
    Promise<void> {
    const data =
      await backstopRequestJson<unknown>(
        '/api/account/export',
      );

    const blob =
      new Blob(
        [
          JSON.stringify(
            data,
            null,
            2,
          ),
        ],
        {
          type:
            'application/json',
        },
      );

    const url =
      URL.createObjectURL(
        blob,
      );

    const anchor =
      document.createElement(
        'a',
      );

    anchor.href =
      url;

    anchor.download =
      `backstop-data-${new Date()
        .toISOString()
        .slice(
          0,
          10,
        )}.json`;

    document.body.appendChild(
      anchor,
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(
      url,
    );
  },

  async deleteAccount():
    Promise<void> {
    await backstopRequestJson<void>(
      '/api/account',
      {
        method:
          'DELETE',
        body:
          JSON.stringify({
            confirmation:
              'DELETE',
          }),
      },
    );

    try {
      await authService.signOut();
    } catch {
      // The server has already deleted the auth identity and sessions.
    }
  },
};
