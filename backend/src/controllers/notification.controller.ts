import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import {
  listForUser,
  markAllRead,
  markRead,
  removeUserSubscription,
  saveSubscription,
  sendPushToUser,
  type RawPushSubscription,
} from '../services/notification.service.js';
import { ok, fail } from '../utils/response.js';

// ─── Validation schema ─────────────────────────────────────────────────────────

const subscribeSchema = z.object({
  endpoint: z.string().url('endpoint must be a valid URL'),
  keys: z.object({
    p256dh: z.string().min(1, 'p256dh key is required'),
    auth: z.string().min(1, 'auth key is required'),
  }),
});

const unsubscribeSchema = z.object({ endpoint: z.string().url('endpoint must be a valid URL') });

// ─── Controllers ──────────────────────────────────────────────────────────────

/** GET /notifications — the caller's inbox, newest first (the bell and the notifications page). */
export async function listMine(req: Request, res: Response) {
  return ok(res, await listForUser(req.user!.id));
}

/** POST /notifications/mark-all-read */
export async function readAll(req: Request, res: Response) {
  await markAllRead(req.user!.id);
  return ok(res, { message: 'All notifications marked read.' });
}

/** POST /notifications/:id/read — only the owner's own notification. */
export async function readOne(req: Request, res: Response) {
  const found = await markRead(req.user!.id, req.params.id);
  if (!found) return fail(res, 'Notification not found', 404);
  return ok(res, { message: 'Marked read.' });
}

/** POST /notifications/unsubscribe — the caller turning push off on this device. */
export async function unsubscribe(req: Request, res: Response) {
  const parsed = unsubscribeSchema.safeParse(req.body);
  if (!parsed.success) return fail(res, parsed.error.errors.map((e) => e.message).join(', '), 422);
  await removeUserSubscription(req.user!.id, parsed.data.endpoint);
  return ok(res, { message: 'Push notifications turned off for this device.' });
}

/**
 * GET /api/notifications/vapid-public-key
 * Public endpoint — the frontend needs this key to call
 * pushManager.subscribe({ applicationServerKey: ... }).
 */
export async function getVapidPublicKey(_req: Request, res: Response) {
  ok(res, { publicKey: env.vapid.publicKey });
}

/**
 * POST /api/notifications/subscribe
 * Authenticated. Saves the caller's PushSubscription to the database.
 *
 * Body:
 *   { endpoint: string, keys: { p256dh: string, auth: string } }
 */
export async function subscribe(req: Request, res: Response) {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors.map((e) => e.message).join(', '), 422);
  }

  const sub: RawPushSubscription = parsed.data;
  await saveSubscription(req.user!.id, sub);

  res.status(201).json({ message: 'Subscribed successfully.' });
}

/**
 * POST /api/notifications/test
 * Authenticated. Fires a test push to every device registered by the caller.
 * Only available in development so this endpoint can't be abused in production.
 */
export async function sendTestPush(req: Request, res: Response) {
  if (env.nodeEnv === 'production') {
    return fail(res, 'Test push endpoint is disabled in production.', 403);
  }

  await sendPushToUser(req.user!.id, {
    title: '🔔 USWAG Push Test',
    body: 'Web Push is working! You can now receive real-time notifications.',
    url: env.frontendOrigin,
  });

  ok(res, { message: 'Test push sent. Check your browser.' });
}
