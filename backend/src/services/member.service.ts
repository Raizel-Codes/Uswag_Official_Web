import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { buildQrValue } from './qr.service.js';
import { hashStudentId, encryptStudentId } from '../utils/crypto.js';

// Serial number format: UW-<academicYearStart>-<zero-padded sequence>.
// Never sequential in a way that's guessable per-member without a DB lookup —
// the QR security comes from the HMAC signature, not the serial's obscurity.
export async function generateSerialNumber(academicYearStart: number): Promise<string> {
  const count = await prisma.memberProfile.count();
  return `UW-${academicYearStart}-${String(count + 1).padStart(6, '0')}`;
}

// NwSSU's academic year runs roughly June–March. Before June, "now" still
// belongs to the year that started the previous June.
// Used as the default when an approve action doesn't specify one (e.g. a
// quick one-click approve from a dashboard list, vs. a form that lets an
// officer pick a specific year for a late/backdated renewal).
export function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startYear = now.getMonth() >= 5 ? year : year - 1; // getMonth() is 0-indexed; 5 = June
  return `${startYear}-${startYear + 1}`;
}

// Approve/reject are the moment the Secretary "handles" an application, so
// both also delete the temporary data held only for that review: the
// encrypted student ID and the helper's name. The permanent studentIdHash
// stays (it's what stops a second application with the same ID).
const CLEAR_REVIEW_DATA = { studentIdCiphertext: null, proxyName: null } as const;

export async function approveApplication(profileId: string, academicYear?: string) {
  const year = academicYear || getCurrentAcademicYear();
  const [yearStart] = year.split('-');
  const serialNumber = await generateSerialNumber(Number(yearStart));

  return prisma.memberProfile.update({
    where: { id: profileId },
    data: { status: 'ACTIVE', serialNumber, academicYear: year, qrIssuedAt: new Date(), ...CLEAR_REVIEW_DATA },
  });
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
