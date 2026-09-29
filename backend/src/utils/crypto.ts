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

// ---------------------------------------------------------------------------
// Student ID protection (membership applications, Article III).
//
// The raw student ID never touches the database:
// - hashStudentId(): HMAC-SHA256 under STUDENT_ID_HASH_KEY. A deterministic
//   "blind index" — the same ID always gives the same hash, so a unique
//   column can reject a second application, but the hash can't be reversed
//   without the key (which lives only in .env, never in the DB). Kept.
// - encryptStudentId()/decryptStudentId(): AES-256-GCM under a separate
//   STUDENT_ID_ENC_KEY, so the Secretary can read the ID while verifying.
//   Deleted as soon as the application is approved or rejected.
// ---------------------------------------------------------------------------

/** Uppercase, no spaces or hyphens: "21-0123 4" and "2101234" are the same ID. */
export function normalizeStudentId(raw: string): string {
  return raw.replace(/[\s-]/g, '').toUpperCase();
}

export function hashStudentId(raw: string): string {
  return crypto.createHmac('sha256', env.studentId.hashKey).update(normalizeStudentId(raw)).digest('hex');
}

/** Returns "iv.tag.ciphertext" (base64 parts). A fresh random IV every call. */
export function encryptStudentId(raw: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', env.studentId.encKey, iv);
  const ct = Buffer.concat([cipher.update(raw.trim(), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ct].map((b) => b.toString('base64')).join('.');
}

/** Throws if the value was tampered with or the key is wrong (GCM auth tag). */
export function decryptStudentId(stored: string): string {
  const [iv, tag, ct] = stored.split('.').map((p) => Buffer.from(p, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', env.studentId.encKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}
