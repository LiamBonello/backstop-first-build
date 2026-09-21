import type {
  PoolClient,
  QueryResultRow,
} from 'pg';

import {
  getDbPool,
} from './db/pool';

interface AccountProfileRow
  extends QueryResultRow {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AccountDataExport {
  exportedAtIso: string;
  account: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    createdAtIso: string;
    updatedAtIso: string;
  };
  protectedPurchases:
    Record<string, unknown>[];
  notificationPreferences:
    Record<string, unknown> | null;
  deadlineNotifications:
    Record<string, unknown>[];
  resolutionCases:
    Record<string, unknown>[];
  resolutionCaseEvents:
    Record<string, unknown>[];
}

const rowsAsRecords = (
  rows: QueryResultRow[],
): Record<string, unknown>[] =>
  rows.map(
    (row) => ({
      ...row,
    }),
  );

const deleteAccountData = async (
  client: PoolClient,
  userId: string,
): Promise<void> => {
  await client.query(
    'DELETE FROM resolution_case_events WHERE client_id = $1',
    [userId],
  );

  await client.query(
    'DELETE FROM resolution_cases WHERE client_id = $1',
    [userId],
  );

  await client.query(
    'DELETE FROM deadline_notifications WHERE client_id = $1',
    [userId],
  );

  await client.query(
    'DELETE FROM client_notification_preferences WHERE client_id = $1',
    [userId],
  );

  await client.query(
    'DELETE FROM protected_purchases WHERE client_id = $1',
    [userId],
  );
};

export const accountRepository = {
  async userExists(
    userId: string,
  ): Promise<boolean> {
    const result =
      await getDbPool().query(
        `
          SELECT 1
          FROM neon_auth."user"
          WHERE id = $1
            AND COALESCE(banned, false) = false
          LIMIT 1
        `,
        [userId],
      );

    return Boolean(
      result.rows[0],
    );
  },

  async exportData(
    userId: string,
  ): Promise<
    AccountDataExport | null
  > {
    const pool =
      getDbPool();

    const [
      accountResult,
      purchasesResult,
      preferencesResult,
      notificationsResult,
      casesResult,
      eventsResult,
    ] =
      await Promise.all([
        pool.query<AccountProfileRow>(
          `
            SELECT
              id,
              name,
              email,
              "emailVerified" AS email_verified,
              "createdAt" AS created_at,
              "updatedAt" AS updated_at
            FROM neon_auth."user"
            WHERE id = $1
            LIMIT 1
          `,
          [userId],
        ),
        pool.query(
          `
            SELECT
              id,
              source_scan_id,
              merchant,
              domain,
              product,
              amount,
              currency,
              amount_label,
              purchase_date,
              delivery_date,
              return_deadline,
              warranty_deadline,
              renewal_deadline,
              protection_terms,
              lifecycle_status,
              lifecycle_updated_at,
              evidence_snapshot,
              created_at,
              updated_at
            FROM protected_purchases
            WHERE client_id = $1
            ORDER BY created_at ASC
          `,
          [userId],
        ),
        pool.query(
          `
            SELECT
              lead_days,
              created_at,
              updated_at
            FROM client_notification_preferences
            WHERE client_id = $1
            LIMIT 1
          `,
          [userId],
        ),
        pool.query(
          `
            SELECT
              id,
              protected_purchase_id,
              deadline_kind,
              deadline_date,
              read_at,
              delivered_at,
              created_at
            FROM deadline_notifications
            WHERE client_id = $1
            ORDER BY created_at ASC
          `,
          [userId],
        ),
        pool.query(
          `
            SELECT
              id,
              protected_purchase_id,
              issue_type,
              amount_in_dispute,
              currency,
              desired_outcome,
              status,
              created_at,
              updated_at
            FROM resolution_cases
            WHERE client_id = $1
            ORDER BY created_at ASC
          `,
          [userId],
        ),
        pool.query(
          `
            SELECT
              id,
              resolution_case_id,
              event_type,
              detail,
              created_at
            FROM resolution_case_events
            WHERE client_id = $1
            ORDER BY created_at ASC
          `,
          [userId],
        ),
      ]);

    const account =
      accountResult.rows[0];

    if (!account) {
      return null;
    }

    return {
      exportedAtIso:
        new Date().toISOString(),
      account: {
        id:
          account.id,
        name:
          account.name,
        email:
          account.email,
        emailVerified:
          account.email_verified,
        createdAtIso:
          account.created_at.toISOString(),
        updatedAtIso:
          account.updated_at.toISOString(),
      },
      protectedPurchases:
        rowsAsRecords(
          purchasesResult.rows,
        ),
      notificationPreferences:
        preferencesResult.rows[0]
          ? {
              ...preferencesResult.rows[0],
            }
          : null,
      deadlineNotifications:
        rowsAsRecords(
          notificationsResult.rows,
        ),
      resolutionCases:
        rowsAsRecords(
          casesResult.rows,
        ),
      resolutionCaseEvents:
        rowsAsRecords(
          eventsResult.rows,
        ),
    };
  },

  async deleteAccount(
    userId: string,
  ): Promise<boolean> {
    const pool =
      getDbPool();

    const client =
      await pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      await deleteAccountData(
        client,
        userId,
      );

      const deletedUser =
        await client.query(
          `
            DELETE FROM neon_auth."user"
            WHERE id = $1
            RETURNING id
          `,
          [userId],
        );

      await client.query(
        'COMMIT',
      );

      return Boolean(
        deletedUser.rows[0],
      );
    } catch (error) {
      await client.query(
        'ROLLBACK',
      );

      throw error;
    } finally {
      client.release();
    }
  },
};
