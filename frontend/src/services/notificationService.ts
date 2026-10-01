import { api } from './api';
import type { AnnouncementNotification } from '@/types/post.types';

export async function listNotifications(): Promise<AnnouncementNotification[]> {
  const { data } = await api.get<{ success: boolean; data: AnnouncementNotification[] }>('/notifications');
  return data.data;
}

export async function markAllRead(): Promise<void> {
  await api.post('/notifications/mark-all-read');
}

export async function markRead(id: string): Promise<void> {
  await api.post(`/notifications/${id}/read`);
}

/** The server's Web Push public key (public, so it works before sign-in). */
export async function getVapidPublicKey(): Promise<string> {
  const { data } = await api.get<{ success: boolean; data: { publicKey: string } }>('/notifications/vapid-public-key');
  return data.data.publicKey;
}

export async function subscribeToPush(subscription: PushSubscriptionJSON): Promise<void> {
  await api.post('/notifications/subscribe', subscription);
}

export async function unsubscribeFromPush(endpoint: string): Promise<void> {
  await api.post('/notifications/unsubscribe', { endpoint });
}

/**
 * Stops push on THIS device and tells the server. Run at sign-out: on a shared computer, the next
 * person to sign in must not receive the previous person's notifications. Best effort — a failure
 * here must never block signing out.
 */
export async function turnOffPushOnThisDevice(): Promise<void> {
  try {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    await unsubscribeFromPush(sub.endpoint).catch(() => undefined);
    await sub.unsubscribe();
  } catch {
    /* ignore */
  }
}
