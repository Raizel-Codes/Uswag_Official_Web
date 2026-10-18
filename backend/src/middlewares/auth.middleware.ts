import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { fail } from '../utils/response.js';
import type { AccessTokenPayload } from '../types/jwt.types.js';

// The only requests an account that still has to choose its own password may make.
const PASSWORD_CHANGE_ALLOWED = new Set(['POST /auth/me/password', 'POST /auth/logout']);

// The only changes the developer's account may make: its own sign-out, password and navigation style,
// and the maintenance switch.
// Everything else that writes is refused, so the account can oversee the whole site and alter none of it
// (and so there is nothing of its own to appear in the audit log).
// POST /dev/maintenance is the site's maintenance switch (the one thing the overseer operates; audited).
const DEVELOPER_MAY_WRITE = new Set(['POST /auth/logout', 'POST /auth/me/password', 'PATCH /auth/me/preference', 'POST /dev/maintenance']);

// A GET that is not a pure read: it decrypts an applicant's student ID (and writes an audit entry).
// The overseer has no need to see people's IDs.
const DEVELOPER_MAY_NOT_READ = [/^\/members\/[^/]+\/student-id$/];

// Verifies the access token and attaches req.user.
// This is the ONLY place that should trust a JWT's claims — every
// downstream permission check in role.middleware.ts relies on this
// having run first.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return fail(res, 'Missing or malformed Authorization header', 401);

  let payload: AccessTokenPayload;
  try {
    payload = jwt.verify(header.slice(7), env.jwt.accessSecret) as AccessTokenPayload;
  } catch {
    return fail(res, 'Invalid or expired token', 401);
  }
  req.user = {
    id: payload.sub,
    role: payload.role,
    officerPosition: payload.officerPosition,
    isDeveloper: payload.dev === true,
    mustChangePassword: payload.mcp === true,
  };

  const route = `${req.method} ${req.originalUrl.split('?')[0].replace(/^\/api\/v1/, '')}`;
  const path = route.slice(route.indexOf(' ') + 1);

  if (payload.mcp && !PASSWORD_CHANGE_ALLOWED.has(route)) {
    return fail(res, 'Choose your own password before continuing.', 403, { code: 'PASSWORD_CHANGE_REQUIRED' });
  }
  if (payload.dev) {
    const reads = req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS';
    if (reads ? DEVELOPER_MAY_NOT_READ.some((re) => re.test(path)) : !DEVELOPER_MAY_WRITE.has(route)) {
      return fail(res, 'The developer account is view-only. It can see everything and change nothing.', 403, { code: 'DEVELOPER_VIEW_ONLY' });
    }
  }
  next();
}
