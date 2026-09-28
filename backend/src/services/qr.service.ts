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
