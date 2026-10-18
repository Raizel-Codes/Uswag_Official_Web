import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { buildQrValue } from './qr.service.js';
import { hashStudentId, encryptStudentId } from '../utils/crypto.js';
import { academicYearEnd, academicYearStart, currentAcademicYear } from '../utils/academicYear.js';
import { assertCanActivate } from './fee.service.js';

// Serial number format: UW-<academicYearStart>-<zero-padded sequence>: one past the highest already
// issued for that year. (It used to be "number of profiles + 1", but approving someone doesn't change
// that number, so the second approval in a row got the same serial and failed.) The QR security comes
// from the HMAC signature, not the serial's obscurity. Two approvals at the same instant can still pick
// the same number; the unique index rejects one and approveApplication tries again.
export async function generateSerialNumber(academicYearStart: number): Promise<string> {
  const prefix = `UW-${academicYearStart}-`;
  const last = await prisma.memberProfile.findFirst({
    where: { serialNumber: { startsWith: prefix } },
    orderBy: { serialNumber: 'desc' },
    select: { serialNumber: true },
  });
  const next = (last ? parseInt(last.serialNumber.slice(prefix.length), 10) || 0 : 0) + 1;
  return `${prefix}${String(next).padStart(6, '0')}`;
}

// The default when an approve action doesn't specify a year (e.g. a quick one-click approve from a
// dashboard list, vs. a form that lets an officer pick a specific year). The year's boundaries —
// and the assumption behind them — live in utils/academicYear.ts.
export function getCurrentAcademicYear(): string {
  return currentAcademicYear();
}

// Approve/reject are the moment the Secretary "handles" an application, so
// both also delete the temporary data held only for that review: the
// encrypted student ID and the helper's name. The permanent studentIdHash
// stays (it's what stops a second application with the same ID).
const CLEAR_REVIEW_DATA = { studentIdCiphertext: null, proxyName: null } as const;

export async function approveApplication(profileId: string, academicYear?: string) {
  const year = academicYear || getCurrentAcademicYear();
  // The fee has to be recorded first, for everyone: this is the one door to ACTIVE for an application,
  // so the Super Admin's approval goes through it too (services/fee.service.ts).
  await assertCanActivate(profileId, year);
  const [yearStart] = year.split('-');
  for (let attempt = 1; ; attempt++) {
    const serialNumber = await generateSerialNumber(Number(yearStart));
    try {
      return await prisma.memberProfile.update({
        where: { id: profileId },
        data: { status: 'ACTIVE', serialNumber, academicYear: year, expiresAt: academicYearEnd(year), qrIssuedAt: new Date(), ...CLEAR_REVIEW_DATA },
      });
    } catch (err) {
      const clash = (err as { code?: string; meta?: { target?: unknown } }).code === 'P2002' && String((err as { meta?: { target?: unknown } }).meta?.target).includes('serialNumber');
      if (!clash || attempt >= 5) throw err;
    }
  }
}

/**
 * Renews a lapsed membership for `academicYear` (the current one unless the Secretary picks a later
 * one): Article III §3, "renewable annually". The member keeps their serial number and the same card,
 * which verifies again once they're ACTIVE. Collecting the fee stays a Treasurer entry (finance).
 */
export async function renewMembership(profileId: string, academicYear?: string) {
  const year = academicYear || getCurrentAcademicYear();
  await assertCanActivate(profileId, year);
  return prisma.memberProfile.update({
    where: { id: profileId },
    data: { status: 'ACTIVE', academicYear: year, expiresAt: academicYearEnd(year), qrIssuedAt: new Date() },
  });
}

/** A renewal can't be for a year that has already ended — it would lapse again straight away. */
export function isPastAcademicYear(year: string): boolean {
  return !(academicYearStart(year) >= academicYearStart(currentAcademicYear()));
}

export async function rejectApplication(profileId: string) {
  return prisma.memberProfile.update({
    where: { id: profileId },
    data: { status: 'REJECTED', ...CLEAR_REVIEW_DATA },
  });
}

// Self-service membership application (public /members/apply route — see
// member.routes.ts). Creates the account up front, in PENDING status, so
// the Secretary sees it in the same "Pending Applications" queue as any
// other application (member.controller.ts's toMemberDTO/listMembers).
// The serial number here is a placeholder, never used for QR/attendance —
// approveApplication() overwrites it with a real one on approval.
export async function submitApplication(data: {
  name: string;
  email: string;
  passwordHash: string;
  collegeOrDept: string;
  yearLevel?: string;
  studentId: string;
  proxyName?: string;
}) {
  const placeholderSerial = `UW-PENDING-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      awaitingPasswordSetup: Boolean(data.proxyName),
      role: 'MEMBER',
      collegeOrDept: data.collegeOrDept,
      yearLevel: data.yearLevel,
      memberProfile: {
        create: {
          status: 'PENDING',
          serialNumber: placeholderSerial,
          academicYear: getCurrentAcademicYear(),
          studentIdHash: hashStudentId(data.studentId),
          studentIdCiphertext: encryptStudentId(data.studentId),
          submittedByProxy: Boolean(data.proxyName),
          proxyName: data.proxyName ?? null,
        },
      },
    },
    include: { memberProfile: true },
  });
}

// Member standing (Article III). Only an ACTIVE member — approved, fee paid,
// oriented, within the current academic year — may hold a digital card or
// join events. Everyone else gets a plain-language reason, which the member
// portal shows in place of the card / RSVP button (never a silent hide).
const STANDING_BLOCKED: Record<'PENDING' | 'EXPIRED' | 'REJECTED', string> = {
  PENDING:
    'Your application is still pending. Your digital card and event sign-ups open once the Secretary approves it (Article III: submit the form, pay the membership fee, attend orientation).',
  EXPIRED:
    'Your membership has expired. Membership lasts one academic year (Article III §3). Renew with the Secretary to get a new card and join events.',
  REJECTED:
    'Your membership application was not approved. Contact the Secretary if you have questions or want to apply again.',
};

/** null when the member is in good standing; otherwise why they aren't. */
export function standingBlock(status: string): string | null {
  return status === 'ACTIVE' ? null : STANDING_BLOCKED[status as keyof typeof STANDING_BLOCKED] ?? 'Your membership is not active.';
}

export async function getDigitalCard(userId: string) {
  const profile = await prisma.memberProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error('Member profile not found');
  return { qrValue: buildQrValue(userId), serialNumber: profile.serialNumber };
}
