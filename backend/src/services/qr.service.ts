import { prisma } from '../config/db.js';
import { signMemberId, verifySignature } from '../utils/crypto.js';

// Core QR issuance + verification logic. See claude.md "QR membership
// system" — this is the security-relevant part of the whole platform.
// Do not add a client-trusting shortcut here "for demo purposes."

export function buildQrValue(memberId: string): string {
  const signature = signMemberId(memberId);
  return `USWAG-MEMBER:UUID=${memberId}:SIG=${signature}:V=1`;
}

interface ParsedQr {
  memberId: string;
  signature: string;
  version: number;
}

function parseQrValue(raw: string): ParsedQr | null {
  const match = raw.match(/^USWAG-MEMBER:UUID=([^:]+):SIG=([^:]+):V=(\d+)$/);
  if (!match) return null;
  return { memberId: match[1], signature: match[2], version: Number(match[3]) };
}

export type VerifyOutcome =
  | { status: 'invalid'; reason: string }
  | { status: 'expired'; reason: string; memberId: string }
  | { status: 'valid'; memberId: string };

export async function verifyQrValue(raw: string): Promise<VerifyOutcome> {
  const parsed = parseQrValue(raw);
  if (!parsed) return { status: 'invalid', reason: 'Malformed QR payload' };

  if (!verifySignature(parsed.memberId, parsed.signature)) {
    return { status: 'invalid', reason: 'Signature mismatch — possible cloned or tampered QR' };
  }

  const member = await prisma.memberProfile.findUnique({ where: { userId: parsed.memberId } });
  if (!member) return { status: 'invalid', reason: 'No matching member record' };

  if (member.status === 'EXPIRED') {
    return { status: 'expired', reason: 'Membership has expired — renewal required (Article III §3)', memberId: parsed.memberId };
  }
  if (member.status !== 'ACTIVE') {
    return { status: 'invalid', reason: `Membership status is ${member.status.toLowerCase()}` };
  }

  return { status: 'valid', memberId: parsed.memberId };
}

// ---------------------------------------------------------------------------
// Officer identity QR — an officer's own signed ID, so it can be verified at
// meetings and forums they conduct (not tied to a UswagEvent/RSVP the way
// member attendance is — see attendance.service.ts). Same HMAC key and
// mechanism as the member QR, just a different, clearly distinguishable
// payload prefix so the two can never be confused or substituted for one
// another. Verifying one never writes an AttendanceRecord; the scan
// controller logs it to the audit trail instead (accountability, not
// event attendance).
// ---------------------------------------------------------------------------

export function buildOfficerQrValue(officerId: string): string {
  const signature = signMemberId(officerId);
  return `USWAG-OFFICER:UUID=${officerId}:SIG=${signature}:V=1`;
}

interface ParsedOfficerQr {
  officerId: string;
  signature: string;
  version: number;
}

function parseOfficerQrValue(raw: string): ParsedOfficerQr | null {
  const match = raw.match(/^USWAG-OFFICER:UUID=([^:]+):SIG=([^:]+):V=(\d+)$/);
  if (!match) return null;
  return { officerId: match[1], signature: match[2], version: Number(match[3]) };
}

export type VerifyOfficerOutcome =
  | { status: 'invalid'; reason: string }
  | { status: 'valid'; officerId: string; name: string; officerPosition: string | null };

export async function verifyOfficerQrValue(raw: string): Promise<VerifyOfficerOutcome> {
  const parsed = parseOfficerQrValue(raw);
  if (!parsed) return { status: 'invalid', reason: 'Malformed QR payload' };

  if (!verifySignature(parsed.officerId, parsed.signature)) {
    return { status: 'invalid', reason: 'Signature mismatch — possible cloned or tampered QR' };
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.officerId } });
  // Re-checked live, same as a member card: a reassigned or removed officer's old QR stops
  // verifying immediately, without needing to revoke anything separately.
  if (!user || (user.role !== 'OFFICER_ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return { status: 'invalid', reason: 'No matching officer record' };
  }

  return { status: 'valid', officerId: user.id, name: user.name, officerPosition: user.officerPosition };
}
