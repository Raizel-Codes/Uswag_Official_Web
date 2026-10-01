import type { Request, Response } from 'express';
import {
  validateCredentials,
  issueTokens,
  verifyRefreshToken,
  revokeAllSessions,
  createPasswordResetToken,
  consumePasswordResetToken,
  RESET_TOKEN_TTL_MS,
} from '../services/auth.service.js';
import { isEmailConfigured, maskEmail, sendPasswordResetEmail } from '../services/email.service.js';
import { recordResetRequest } from '../services/resetRequest.service.js';
import { ok, fail } from '../utils/response.js';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// How soon after one reset email another can be requested for the same account.
const RESET_COOLDOWN_MS = 2 * 60 * 1000;

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
// The link is emailed (services/email.service.ts). The reset link is a live credential, so it is
// never written to the log. With no email provider configured nothing can be sent: the server
// logs a warning, and — outside production only — the link comes back in the response so the flow
// stays testable locally. It is never in a production response.
//
// Two protections against abuse once mail is on: a short cooldown per account (so the form can't be
// used to flood someone's inbox, or to keep invalidating the link they're about to use), and the
// email is sent without waiting for it, so how long the response takes doesn't reveal whether the
// address has an account.
export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  const user = await prisma.user.findFirst({ where: { email: { equals: email.trim(), mode: 'insensitive' } } });

  const genericMessage = "If an account exists for that email, we've sent a password reset link.";

  if (!user) {
    return ok(res, { message: genericMessage });
  }

  const emailOn = isEmailConfigured();
  if (emailOn) {
    const issuedAt = user.passwordResetExpiresAt ? user.passwordResetExpiresAt.getTime() - RESET_TOKEN_TTL_MS : 0;
    if (Date.now() - issuedAt < RESET_COOLDOWN_MS) return ok(res, { message: genericMessage });
  }

  const rawToken = await createPasswordResetToken(user.id);
  const resetUrl = `${env.frontendOrigin}/reset-password?token=${rawToken}`;

  if (emailOn) {
    void sendPasswordResetEmail(user.email, user.name, resetUrl, RESET_TOKEN_TTL_MS / 60_000);
  } else {
    logger.warn(`Password reset requested for ${maskEmail(user.email)}, but no email provider is configured (set RESEND_API_KEY and EMAIL_FROM), so nothing was sent.`);
  }

  return ok(res, {
    message: genericMessage,
    ...(!emailOn && env.nodeEnv !== 'production' ? { devResetUrl: resetUrl } : {}),
  });
}

// Public. The page asks this first so it shows the right form: an email field, or an email + student ID
// request to the officers.
export function resetOptions(_req: Request, res: Response) {
  return ok(res, { method: isEmailConfigured() ? 'email' : 'officer' });
}

// Public. "I can't get my reset by email": asks the officers for help (services/resetRequest.service.ts).
// The answer is the same whether or not the email has an account, and is sent before the request is
// processed, so neither the wording nor the timing says which.
export function requestResetHelp(req: Request, res: Response) {
  void recordResetRequest(req.body.email, req.body.studentId);
  return ok(res, { message: "If that email belongs to a USWAG account, the officers have been told. Someone will contact you with a private link to set a new password." });
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
