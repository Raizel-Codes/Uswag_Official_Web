import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import type { AccessTokenPayload, RefreshTokenPayload } from '../types/jwt.types.js';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(rawToken: string) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export async function validateCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const matches = await bcrypt.compare(password, user.passwordHash);
  return matches ? user : null;
}

export function issueTokens(user: { id: string; role: any; officerPosition: any; tokenVersion: number }) {
  const accessPayload: AccessTokenPayload = { sub: user.id, role: user.role, officerPosition: user.officerPosition };
  const refreshPayload: RefreshTokenPayload = { sub: user.id, tokenVersion: user.tokenVersion };

  const accessToken = jwt.sign(accessPayload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiresIn as any });
  const refreshToken = jwt.sign(refreshPayload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiresIn as any });

  return { accessToken, refreshToken };
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

// Verifies signature + expiry only — the caller (auth.controller.ts refresh())
// still has to compare payload.tokenVersion against the current DB value,
// since a valid-but-revoked refresh token (logout, or a future
// "log out all devices" action) has to fail even though the JWT itself
// still verifies fine.
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as RefreshTokenPayload;
}

// Bumps the user's tokenVersion so every refresh token issued before this
// call stops working on its next use — this is the actual "logout"/session
// revocation mechanism. The access token already in a browser's memory
// still works until it naturally expires (accessExpiresIn, default 15m);
// there is no access-token blocklist, which is the standard trade-off for
// short-lived access tokens + a revocable refresh token.
export async function revokeAllSessions(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } });
}

// Generates a one-time password-reset token. Only the SHA-256 hash is
// persisted (schema.prisma comment explains why); the raw token returned
// here is the only time it ever exists in plaintext, and it's the caller's
// job to get it to the user out-of-band (email, or a dev-only response
// field — see auth.controller.ts forgotPassword()).
export async function createPasswordResetToken(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetTokenHash: hashResetToken(rawToken),
      passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });
  return rawToken;
}

// Verifies the raw token against the stored hash + expiry, sets the new
// password, and — since a password reset implies the old password may be
// compromised or simply forgotten — revokes every other outstanding
// session (bumps tokenVersion) and clears the reset token so it can't be
// replayed.
export async function consumePasswordResetToken(rawToken: string, newPassword: string) {
  const tokenHash = hashResetToken(rawToken);
  const user = await prisma.user.findFirst({ where: { passwordResetTokenHash: tokenHash } });

  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now()) {
    return null;
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      tokenVersion: { increment: 1 },
    },
  });
  return user;
}
