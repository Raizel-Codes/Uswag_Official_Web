import type { Request, Response } from 'express';
import {
  validateCredentials,
  issueTokens,
  verifyRefreshToken,
  revokeAllSessions,
  createPasswordResetToken,
  consumePasswordResetToken,
} from '../services/auth.service.js';
import { ok, fail } from '../utils/response.js';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Shared shape between login and refresh — both return the same AuthSession
// the frontend expects (accessToken, refreshToken, user).
function toAuthSession(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  officerPosition: string | null;
  collegeOrDept: string;
  navStyle: string;
  tokenVersion: number;
}) {
  const tokens = issueTokens(user as any);
  return {
    ...tokens,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),                                      // e.g. 'super_admin'
      officerPosition: user.officerPosition?.toLowerCase() ?? undefined,  // e.g. 'president'
      collegeOrDept: user.collegeOrDept,
      navStyle: user.navStyle,
    },
  };
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await validateCredentials(email, password);
  if (!user) return fail(res, 'Invalid email or password', 401);

  return ok(res, toAuthSession(user));
}

// Rotates both tokens on every use (refresh token rotation) — a refresh
// token that's already been used once and shows up again is a signal of
// theft/replay. We don't yet detect that specific reuse case (would need to
// store the last-issued token or its jti), but rotation is the prerequisite
// for adding that later without another schema change.
export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) return fail(res, 'Missing refresh token', 400);

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return fail(res, 'Invalid or expired refresh token', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return fail(res, 'Invalid or expired refresh token', 401);

  // The refresh token's embedded version has to match the user's current
  // version — logout() (and any future "log out all devices" action) bumps
  // this, which invalidates every refresh token issued before that point
  // even though they haven't expired yet.
  if (user.tokenVersion !== payload.tokenVersion) {
    return fail(res, 'Session has been revoked. Please log in again.', 401);
  }

  return ok(res, toAuthSession(user));
}

export async function logout(req: Request, res: Response) {
  await revokeAllSessions(req.user!.id);
  return ok(res, { message: 'Logged out' });
}

// Public — no auth. Always responds with the same generic message whether
// or not the email exists, so this can't be used to enumerate registered
// emails (a script probing this endpoint learns nothing either way).
//
// Email delivery gap: there is no email-sending integration in this project
// yet (see claude.md's Integrations list — Graph API, storage, Postgres,
// nothing for outbound mail). Until one is wired up, the reset link is
// logged server-side, and — outside production only — also returned in the
// response so this is testable end-to-end locally. It is never present in
// the response when NODE_ENV=production; a real deployment with no email
// provider configured would leave a user with no way to actually receive
// the link, which is the real gap flagged for follow-up.
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  const genericMessage = "If an account exists for that email, we've sent a password reset link.";

  if (!user) {
    return ok(res, { message: genericMessage });
  }

  const rawToken = await createPasswordResetToken(user.id);
  const resetUrl = `${env.frontendOrigin}/reset-password?token=${rawToken}`;
  logger.info(`Password reset requested for ${user.email}: ${resetUrl}`);

  return ok(res, {
    message: genericMessage,
    ...(env.nodeEnv !== 'production' ? { devResetUrl: resetUrl } : {}),
  });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = req.body;
  const user = await consumePasswordResetToken(token, newPassword);
  if (!user) {
    return fail(res, 'This reset link is invalid or has expired. Please request a new one.', 400);
  }
  return ok(res, { message: 'Password updated. Please log in with your new password.' });
}

export async function updatePreference(req: Request, res: Response) {
  const { navStyle } = req.body;
  if (!['auto', 'bottom', 'sidebar'].includes(navStyle)) {
    return fail(res, 'Invalid navStyle', 400);
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: { navStyle }
  });

  return ok(res, { navStyle: updatedUser.navStyle });
}
