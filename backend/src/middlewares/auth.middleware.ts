import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { fail } from '../utils/response.js';
import type { AccessTokenPayload } from '../types/jwt.types.js';

// Verifies the access token and attaches req.user.
// This is the ONLY place that should trust a JWT's claims — every
// downstream permission check in role.middleware.ts relies on this
// having run first.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return fail(res, 'Missing or malformed Authorization header', 401);

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, env.jwt.accessSecret) as AccessTokenPayload;
    req.user = { id: payload.sub, role: payload.role, officerPosition: payload.officerPosition };
    next();
  } catch {
    return fail(res, 'Invalid or expired token', 401);
  }
}
