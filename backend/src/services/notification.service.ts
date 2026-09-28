import webpush from 'web-push';
import { env } from '../config/env.js';
import { prisma } from '../config/db.js';

// Initialise VAPID credentials once at import time.
// env.vapid.* is required() — the server will not boot without them.
webpush.setVapidDetails(
  env.vapid.subject,
  env.vapid.publicKey,
  env.vapid.privateKey,
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PushPayload {
  title: string;
  body: string;
  /** Optional URL to open when the user clicks the notification. */
  url?: string;
  /** Optional icon URL (defaults to the site icon in the SW). */
  icon?: string;
}

// The shape the browser sends when it calls pushManager.subscribe()
// and the frontend POSTs it to our /subscribe endpoint.
export interface RawPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// ─── Subscription persistence ─────────────────────────────────────────────────

/**
 * Upserts a PushSubscription row for the given user.
 * Uses the unique `endpoint` as the conflict key so a re-subscribe
 * for the same browser updates keys rather than duplicating rows.
 */
export async function saveSubscription(
  userId: string,
  sub: RawPushSubscription,
): Promise<void> {
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userId,
    },
    create: {
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  });
}

/**
 * Removes a PushSubscription row by endpoint.
 * Called automatically when a push returns HTTP 410 (Gone).
 */
export async function removeSubscription(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

// ─── Sending helpers ──────────────────────────────────────────────────────────

/**
 * Sends a push notification to a single raw subscription object.
 * Low-level — prefer sendPushToUser() for most cases.
 */
export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: PushPayload,
): Promise<void> {
  await webpush.sendNotification(subscription, JSON.stringify(payload));
}

/**
 * Sends a push notification to every registered device for a given user.
 * Dead subscriptions (HTTP 410) are removed from the DB automatically.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });

  await Promise.allSettled(
    subs.map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
      const wps: webpush.PushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      try {
        await webpush.sendNotification(wps, JSON.stringify(payload));
      } catch (err: any) {
        // HTTP 410 = subscription is no longer valid; clean it up.
        if (err?.statusCode === 410) {
          await removeSubscription(sub.endpoint);
        } else {
          throw err;
        }
      }
    }),
  );
}

/**
 * Broadcasts a push notification to every subscription in the database.
 * Intended for system-wide announcements (e.g. new events, urgent news).
 * Dead subscriptions are removed automatically.
 */
export async function broadcastPush(payload: PushPayload): Promise<void> {
  const subs = await prisma.pushSubscription.findMany();

  await Promise.allSettled(
    subs.map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
      const wps: webpush.PushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      try {
        await webpush.sendNotification(wps, JSON.stringify(payload));
      } catch (err: any) {
        if (err?.statusCode === 410) {
          await removeSubscription(sub.endpoint);
        } else {
          throw err;
        }
      }
    }),
  );
}
