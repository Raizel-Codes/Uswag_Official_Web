import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/db.js';
import { getMaintenance } from '../services/maintenance.service.js';
import type { AccessTokenPayload } from '../types/jwt.types.js';

// While the site is in maintenance, answer every API request with 503 MAINTENANCE, except:
//   - OPTIONS: the browser's CORS preflight
//   - the public status check, so the page can read the end time
//   - the developer: their sign-in, their token refresh, and any request carrying their access token
// (/health is registered before this in app.ts: Render pings it, and a failing health check gets the
// service restarted, which is the last thing wanted mid-maintenance.)
//
// This is the lock itself. The maintenance page in the browser is only the friendly face of it: a stale
// or cached copy of the app still gets refused here. Mounted after cors(), so the 503 carries the CORS
// headers and the browser lets the app read the body instead of reporting a vague network error.

const PUBLIC_STATUS = '/api/v1/status';

async function emailIsDeveloper(email: unknown): Promise<boolean> {
  if (typeof email !== 'string' || !email.trim()) return false;
  const user = await prisma.user.findFirst({ where: { email: { equals: email.trim(), mode: 'insensitive' } }, select: { isDeveloper: true } });
  return user?.isDeveloper === true;
}

async function refreshIsDeveloper(token: unknown): Promise<boolean> {
  if (typeof token !== 'string') return false;
  try {
    const { sub } = jwt.verify(token, env.jwt.refreshSecret) as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: sub }, select: { isDeveloper: true } });
    return user?.isDeveloper === true;
  } catch {
    return false;
  }
}

function bearerIsDeveloper(req: Request): boolean {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return false;
  try {
    return (jwt.verify(header.slice(7), env.jwt.accessSecret) as AccessTokenPayload).dev === true;
  } catch {
    return false;
  }
}

export async function maintenanceGate(req: Request, res: Response, next: NextFunction) {
  const state = await getMaintenance();
  if (!state.enabled || req.method === 'OPTIONS') return next();

  const path = req.originalUrl.split('?')[0];
  if (path === PUBLIC_STATUS) return next();
  if (bearerIsDeveloper(req)) return next();
  // Sign-in and refresh are checked BEFORE any password is, so a refusal says nothing about the account.
  if (req.method === 'POST' && path === '/api/v1/auth/login' && (await emailIsDeveloper(req.body?.email))) return next();
  if (req.method === 'POST' && path === '/api/v1/auth/refresh' && (await refreshIsDeveloper(req.body?.refreshToken))) return next();

  const secondsLeft = state.endsAt ? Math.ceil((new Date(state.endsAt).getTime() - Date.now()) / 1000) : 0;
  res.set('Retry-After', String(Math.min(Math.max(secondsLeft, 60), 3600)));
  res.set('Cache-Control', 'no-store');
  return res.status(503).json({
    success: false,
    message: 'USWAG is under maintenance. We’ll be back shortly.',
    details: { code: 'MAINTENANCE', startedAt: state.startedAt, endsAt: state.endsAt, message: state.message, serverTime: new Date().toISOString() },
  });
}
