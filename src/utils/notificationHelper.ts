import { storageService } from '../services/storageService';
import type { NotificationModel } from '../types';

export const getNotificationSeenKey = (userId: string | number): string =>
  `notification_seen_at_${String(userId)}`;

export const isValidNotificationItem = (item: unknown): item is NotificationModel => {
  if (!item || typeof item !== 'object') return false;
  const n = item as NotificationModel;
  return Boolean(n.id || n.title || n.body || (n as any).message);
};

export const extractNotificationsList = (notificationsData: any): NotificationModel[] => {
  const raw = Array.isArray(notificationsData)
    ? notificationsData
    : Array.isArray(notificationsData?.data)
      ? notificationsData.data
      : [];
  return raw.filter(isValidNotificationItem);
};

export const markNotificationsLocallySeen = async (
  userId: string | number,
  notifications?: NotificationModel[],
): Promise<string> => {
  let maxMs = Date.now();
  if (Array.isArray(notifications)) {
    for (const item of notifications) {
      if (item.created_at) {
        const ms = new Date(item.created_at).getTime();
        if (!Number.isNaN(ms) && ms > maxMs) {
          maxMs = ms;
        }
      }
    }
  }
  const iso = new Date(maxMs).toISOString();
  if (userId) {
    await storageService.setItem(getNotificationSeenKey(userId), iso);
  }
  return iso;
};
