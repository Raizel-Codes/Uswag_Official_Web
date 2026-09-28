import crypto from 'crypto';
import { env } from '../config/env.js';

// HMAC signing for QR payloads. This is the core anti-clone mechanism —
// see claude.md "QR membership system". The signature proves the payload
// was issued by this server; it does NOT by itself prevent a valid QR
// from being screenshotted and reused — that's what scan logging +
// attendance.service.ts duplicate-detection is for.

export function signMemberId(memberId: string): string {
  return crypto.createHmac('sha256', env.qrSigningSecret).update(memberId).digest('hex').slice(0, 16);
}

export function verifySignature(memberId: string, signature: string): boolean {
  const expected = signMemberId(memberId);
  // timing-safe compare
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
