import webpush from 'web-push';
import { env } from '../config/env.js';
import { prisma } from '../config/db.js';
import { currentAcademicYear } from '../utils/academicYear.js';
import { logger } from '../utils/logger.js';

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
  /** In-app path to open when the notification is tapped, e.g. "/dashboard/events". */
  url?: string;
}

export type NotificationKind = 'announcement' | 'event' | 'membership';

export interface NotificationInput extends PushPayload {
  kind: NotificationKind;
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
 * Called automatically when a push service reports the subscription gone.
 */
export async function removeSubscription(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

/** A person turning push off on one of their devices. Scoped to their own rows, never someone else's. */
export async function removeUserSubscription(userId: string, endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
}

// ─── Delivery ─────────────────────────────────────────────────────────────────

interface StoredSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

const PUSH_BATCH = 25;

/**
 * Sends one payload to each stored subscription, a few at a time. A subscription the push service
 * says is gone (404/410) is deleted; any other failure is logged, never thrown — a notification
 * must not be able to fail the request that caused it.
 */
async function deliver(subs: StoredSubscription[], payload: PushPayload): Promise<void> {
  const body = JSON.stringify(payload);
  let failed = 0;
  for (let i = 0; i < subs.length; i += PUSH_BATCH) {
    const results = await Promise.allSettled(
      subs.slice(i, i + PUSH_BATCH).map(async (sub) => {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body);
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) await removeSubscription(sub.endpoint);
          else throw err;
        }
      }),
    );
    failed += results.filter((r) => r.status === 'rejected').length;
  }
  if (failed > 0) logger.warn(`Web Push: ${failed} of ${subs.length} deliveries failed ("${payload.title}")`);
}

/** Pushes to every device a user has registered (no inbox row — see notifyUsers for that). */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  await deliver(subs, payload);
}

// ─── Inbox + push for real events ─────────────────────────────────────────────

/**
 * Tells these people something: an inbox row for each (so it's there whether or not push works),
 * then a Web Push to their registered devices. Never throws. Callers don't await it — the request
 * that caused the notification has already succeeded.
 */
export async function notifyUsers(userIds: string[], n: NotificationInput): Promise<void> {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: ids.map((userId) => ({ userId, kind: n.kind, title: n.title, body: n.body, url: n.url ?? null })),
    });
    const subs = await prisma.pushSubscription.findMany({ where: { userId: { in: ids } } });
    await deliver(subs, { title: n.title, body: n.body, url: n.url });
  } catch (err) {
    logger.error(`Notification "${n.title}" failed`, err);
  }
}

/** Everyone in good standing: an ACTIVE membership, within its academic year (Article III §3). */
export async function activeMemberUserIds(now: Date = new Date()): Promise<string[]> {
  const profiles = await prisma.memberProfile.findMany({
    where: {
      status: 'ACTIVE',
      academicYear: { gte: currentAcademicYear(now) },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: { userId: true },
  });
  return profiles.map((p) => p.userId);
}

/** Who reviews membership applications: the Secretary (Article VI §2(c)) and the Super Admin. */
export async function notifyApplicationReviewers(n: NotificationInput): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: { OR: [{ role: 'SUPER_ADMIN' }, { role: 'OFFICER_ADMIN', officerPosition: 'SECRETARY' }] },
      select: { id: true },
    });
    await notifyUsers(users.map((u) => u.id), n);
  } catch (err) {
    logger.error(`Notification "${n.title}" failed`, err);
  }
}

/** Announcements and new events go to every member in good standing. */
export async function notifyActiveMembers(n: NotificationInput): Promise<void> {
  try {
    await notifyUsers(await activeMemberUserIds(), n);
  } catch (err) {
    logger.error(`Notification "${n.title}" failed`, err);
  }
}

// ─── Inbox reads ──────────────────────────────────────────────────────────────

const INBOX_LIMIT = 50;

export async function listForUser(userId: string) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: INBOX_LIMIT,
  });
  return rows.map((r) => ({ id: r.id, kind: r.kind, title: r.title, body: r.body, url: r.url, createdAt: r.createdAt, read: r.readAt !== null }));
}

export async function markAllRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
}

/** Marks one of the person's own notifications read. False when it isn't theirs (or doesn't exist). */
export async function markRead(userId: string, id: string): Promise<boolean> {
  const own = await prisma.notification.findFirst({ where: { id, userId }, select: { id: true } });
  if (!own) return false;
  await prisma.notification.updateMany({ where: { id, readAt: null }, data: { readAt: new Date() } });
  return true;
}
