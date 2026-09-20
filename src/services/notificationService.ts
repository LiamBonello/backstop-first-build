import {
  mapDeadlineNotification,
} from '../mappers/notificationMapper';

import type {
  DeadlineNotification,
  NotificationPreferences,
  RawNotificationListDto,
  RawNotificationPreferencesDto,
} from '../types/notification';

import {
  backstopRequestJson,
} from './backstopApi';

export const notificationService = {
  async list(): Promise<{
    notifications:
      DeadlineNotification[];
    preferences:
      NotificationPreferences;
  }> {
    const raw =
      await backstopRequestJson<RawNotificationListDto>(
        '/api/notifications',
      );

    return {
      notifications:
        raw.notifications.map(
          mapDeadlineNotification,
        ),
      preferences: {
        leadDays:
          raw.preferences.leadDays,
      },
    };
  },

  async markRead(
    id: string,
  ): Promise<void> {
    await backstopRequestJson<void>(
      `/api/notifications/${encodeURIComponent(
        id,
      )}/read`,
      {
        method:
          'PATCH',
      },
    );
  },

  async markDelivered(
    id: string,
  ): Promise<void> {
    await backstopRequestJson<void>(
      `/api/notifications/${encodeURIComponent(
        id,
      )}/delivered`,
      {
        method:
          'PATCH',
      },
    );
  },

  async markAllRead(): Promise<void> {
    await backstopRequestJson<void>(
      '/api/notifications/read-all',
      {
        method:
          'POST',
      },
    );
  },

  async updateLeadDays(
    leadDays: number,
  ): Promise<NotificationPreferences> {
    const raw =
      await backstopRequestJson<RawNotificationPreferencesDto>(
        '/api/notifications/preferences',
        {
          method:
            'PATCH',
          body:
            JSON.stringify({
              leadDays,
            }),
        },
      );

    return {
      leadDays:
        raw.leadDays,
    };
  },
};
