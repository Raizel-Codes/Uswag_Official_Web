import type { Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import {
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

// ─── Controllers ──────────────────────────────────────────────────────────────

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
