import {
  randomUUID,
} from 'node:crypto';

import type {
  QueryResultRow,
} from 'pg';

import type {
  DeadlineNotificationKind,
  RawDeadlineNotificationDto,
  RawNotificationPreferencesDto,
} from '../src/types/notification';

import {
  getDbPool,
} from './db/pool';

const DEFAULT_LEAD_DAYS =
  7;

interface DueDeadlineRow
  extends QueryResultRow {
  purchase_id: string;
  deadline_kind:
    DeadlineNotificationKind;
  deadline_date: string;
}

interface NotificationRow
  extends QueryResultRow {
  id: string;
  protected_purchase_id: string;
  merchant: string;
  product: string;
  deadline_kind:
    DeadlineNotificationKind;
  deadline_date: string;
  read_at: Date | null;
  delivered_at: Date | null;
  created_at: Date;
}

interface PreferencesRow
  extends QueryResultRow {
  lead_days: number;
}

const getPreferences = async (
  clientId: string,
): Promise<RawNotificationPreferencesDto> => {
  const result =
    await getDbPool().query<PreferencesRow>(
      `
        SELECT lead_days
        FROM client_notification_preferences
        WHERE client_id = $1
        LIMIT 1
      `,
      [clientId],
    );

  return {
    leadDays:
      result.rows[0]?.lead_days ??
      DEFAULT_LEAD_DAYS,
  };
};

const pruneStaleUnread = async (
  clientId: string,
): Promise<void> => {
  await getDbPool().query(
    `
      DELETE FROM deadline_notifications AS notification
      USING protected_purchases AS purchase
      WHERE notification.client_id = $1
        AND notification.protected_purchase_id = purchase.id
        AND notification.read_at IS NULL
        AND (
          (
            notification.deadline_kind = 'return'
            AND (
              purchase.lifecycle_status <> 'active'
              OR purchase.return_deadline IS DISTINCT FROM notification.deadline_date
            )
          )
          OR (
            notification.deadline_kind = 'warranty'
            AND (
              purchase.lifecycle_status IN ('returned', 'refunded')
              OR purchase.warranty_deadline IS DISTINCT FROM notification.deadline_date
            )
          )
          OR (
            notification.deadline_kind = 'renewal'
            AND (
              purchase.lifecycle_status IN ('returned', 'refunded')
              OR purchase.renewal_deadline IS DISTINCT FROM notification.deadline_date
            )
          )
        )
    `,
    [clientId],
  );
};

const findDueDeadlines = async (
  clientId: string,
  leadDays: number,
): Promise<DueDeadlineRow[]> => {
  const result =
    await getDbPool().query<DueDeadlineRow>(
      `
        SELECT
          id AS purchase_id,
          'return'::text AS deadline_kind,
          return_deadline::text AS deadline_date
        FROM protected_purchases
        WHERE client_id = $1
          AND lifecycle_status = 'active'
          AND return_deadline BETWEEN current_date AND current_date + $2::integer

        UNION ALL

        SELECT
          id AS purchase_id,
          'warranty'::text AS deadline_kind,
          warranty_deadline::text AS deadline_date
        FROM protected_purchases
        WHERE client_id = $1
          AND lifecycle_status IN ('active', 'kept')
          AND warranty_deadline BETWEEN current_date AND current_date + $2::integer

        UNION ALL

        SELECT
          id AS purchase_id,
          'renewal'::text AS deadline_kind,
          renewal_deadline::text AS deadline_date
        FROM protected_purchases
        WHERE client_id = $1
          AND lifecycle_status IN ('active', 'kept')
          AND renewal_deadline BETWEEN current_date AND current_date + $2::integer
      `,
      [
        clientId,
        leadDays,
      ],
    );

  return result.rows;
};

const syncDueNotifications = async (
  clientId: string,
): Promise<RawNotificationPreferencesDto> => {
  const preferences =
    await getPreferences(
      clientId,
    );

  await pruneStaleUnread(
    clientId,
  );

  const deadlines =
    await findDueDeadlines(
      clientId,
      preferences.leadDays,
    );

  for (const deadline of deadlines) {
    await getDbPool().query(
      `
        INSERT INTO deadline_notifications (
          id,
          client_id,
          protected_purchase_id,
          deadline_kind,
          deadline_date
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5
        )
        ON CONFLICT (
          client_id,
          protected_purchase_id,
          deadline_kind,
          deadline_date
        )
        DO NOTHING
      `,
      [
        randomUUID(),
        clientId,
        deadline.purchase_id,
        deadline.deadline_kind,
        deadline.deadline_date,
      ],
    );
  }

  return preferences;
};

const mapNotification = (
  row: NotificationRow,
): RawDeadlineNotificationDto => ({
  id:
    row.id,
  purchaseId:
    row.protected_purchase_id,
  merchant:
    row.merchant,
  product:
    row.product,
  deadlineKind:
    row.deadline_kind,
  deadlineDate:
    row.deadline_date,
  readAtIso:
    row.read_at
      ? row.read_at.toISOString()
      : null,
  deliveredAtIso:
    row.delivered_at
      ? row.delivered_at.toISOString()
      : null,
  createdAtIso:
    row.created_at.toISOString(),
});

export const notificationRepository = {
  async list(
    clientId: string,
  ): Promise<{
    notifications:
      RawDeadlineNotificationDto[];
    preferences:
      RawNotificationPreferencesDto;
  }> {
    const preferences =
      await syncDueNotifications(
        clientId,
      );

    const result =
      await getDbPool().query<NotificationRow>(
        `
          SELECT
            notification.id,
            notification.protected_purchase_id,
            purchase.merchant,
            purchase.product,
            notification.deadline_kind,
            notification.deadline_date::text AS deadline_date,
            notification.read_at,
            notification.delivered_at,
            notification.created_at
          FROM deadline_notifications AS notification
          INNER JOIN protected_purchases AS purchase
            ON purchase.id = notification.protected_purchase_id
          WHERE notification.client_id = $1
          ORDER BY
            (notification.read_at IS NULL) DESC,
            notification.deadline_date ASC,
            notification.created_at DESC
          LIMIT 50
        `,
        [clientId],
      );

    return {
      notifications:
        result.rows.map(
          mapNotification,
        ),
      preferences,
    };
  },

  async markRead(
    clientId: string,
    id: string,
  ): Promise<boolean> {
    const result =
      await getDbPool().query(
        `
          UPDATE deadline_notifications
          SET read_at = COALESCE(read_at, now())
          WHERE client_id = $1
            AND id = $2
        `,
        [
          clientId,
          id,
        ],
      );

    return Boolean(
      result.rowCount,
    );
  },

  async markDelivered(
    clientId: string,
    id: string,
  ): Promise<boolean> {
    const result =
      await getDbPool().query(
        `
          UPDATE deadline_notifications
          SET delivered_at = COALESCE(delivered_at, now())
          WHERE client_id = $1
            AND id = $2
        `,
        [
          clientId,
          id,
        ],
      );

    return Boolean(
      result.rowCount,
    );
  },

  async markAllRead(
    clientId: string,
  ): Promise<void> {
    await getDbPool().query(
      `
        UPDATE deadline_notifications
        SET read_at = COALESCE(read_at, now())
        WHERE client_id = $1
          AND read_at IS NULL
      `,
      [clientId],
    );
  },

  async updatePreferences(
    clientId: string,
    leadDays: number,
  ): Promise<RawNotificationPreferencesDto> {
    await getDbPool().query(
      `
        INSERT INTO client_notification_preferences (
          client_id,
          lead_days
        )
        VALUES ($1, $2)
        ON CONFLICT (client_id)
        DO UPDATE SET
          lead_days = EXCLUDED.lead_days,
          updated_at = now()
      `,
      [
        clientId,
        leadDays,
      ],
    );

    await getDbPool().query(
      `
        DELETE FROM deadline_notifications
        WHERE client_id = $1
          AND read_at IS NULL
          AND deadline_date > current_date + $2::integer
      `,
      [
        clientId,
        leadDays,
      ],
    );

    await syncDueNotifications(
      clientId,
    );

    return {
      leadDays,
    };
  },

  async invalidatePurchase(
    clientId: string,
    purchaseId: string,
  ): Promise<void> {
    await getDbPool().query(
      `
        DELETE FROM deadline_notifications
        WHERE client_id = $1
          AND protected_purchase_id = $2
          AND read_at IS NULL
      `,
      [
        clientId,
        purchaseId,
      ],
    );
  },
};
