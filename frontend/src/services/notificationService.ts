import { api } from './api';
import type { AnnouncementNotification } from '@/types/post.types';

export async function listNotifications(): Promise<AnnouncementNotification[]> {
  const { data } = await api.get<{ success: boolean; data: AnnouncementNotification[] }>('/notifications');
  // Handle both { success, data } and raw array shapes
  return Array.isArray(data) ? data : (data as { data?: AnnouncementNotification[] }).data ?? [];
}

export async function markAllRead(): Promise<void> {
  await api.post('/notifications/mark-all-read');
}

export async function subscribeToPush(subscription: PushSubscriptionJSON): Promise<void> {
  await api.post('/notifications/subscribe', subscription);
}
