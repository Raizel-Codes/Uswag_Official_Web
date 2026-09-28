import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { fail } from '../utils/response.js';

// Shared handler so a throttled request still gets our normal
// { success: false, message } envelope instead of express-rate-limit's
// plain-text default body.
function handler(_req: Request, res: Response) {
  fail(res, 'Too many requests. Please wait a moment and try again.', 429);
}

// Login is the highest-value brute-force/credential-stuffing target in the
// system — it's the only public endpoint that checks a password hash.
// 10 attempts / 15 min / IP is generous for a real user who mistyped a
// password a few times, tight enough to make stuffing a whole list slow.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Membership applications write to the DB (creates a User + MemberProfile)
// and are fully unauthenticated — without a limit here, this endpoint is an
// open door to flood the Secretary's pending-applications queue with junk
// accounts. 5 / hour / IP is plenty for a real applicant (and anyone
// resubmitting after a typo'd email) while blocking scripted spam.
export const applyRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Forgot-password is a classic email-enumeration + spam target — it's
// public, takes an arbitrary email, and (once real email delivery is wired
// up) triggers an outbound message. Same budget as apply.
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
