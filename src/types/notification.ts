export type DeadlineNotificationKind =
  | 'return'
  | 'warranty'
  | 'renewal';

export interface RawDeadlineNotificationDto {
  id: string;
  purchaseId: string;
  merchant: string;
  product: string;
  deadlineKind: DeadlineNotificationKind;
  deadlineDate: string;
  readAtIso: string | null;
  deliveredAtIso: string | null;
  createdAtIso: string;
}

export interface RawNotificationPreferencesDto {
  leadDays: number;
}

export interface RawNotificationListDto {
  notifications: RawDeadlineNotificationDto[];
  preferences: RawNotificationPreferencesDto;
}

export interface DeadlineNotification {
  id: string;
  purchaseId: string;
  kind: DeadlineNotificationKind;
  title: string;
  detail: string;
  deadlineLabel: string;
  daysRemaining: number;
  unread: boolean;
  delivered: boolean;
}

export interface NotificationPreferences {
  leadDays: number;
}
