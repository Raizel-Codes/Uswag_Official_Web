import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { buildQrValue } from './qr.service.js';

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

export async function approveApplication(userId: string, academicYear?: string) {
  const year = academicYear || getCurrentAcademicYear();
  const [yearStart] = year.split('-');
  const serialNumber = await generateSerialNumber(Number(yearStart));

  return prisma.memberProfile.update({
    where: { userId },
    data: { status: 'ACTIVE', serialNumber, academicYear: year, qrIssuedAt: new Date() },
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
}) {
  const placeholderSerial = `UW-PENDING-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      role: 'MEMBER',
      collegeOrDept: data.collegeOrDept,
      yearLevel: data.yearLevel,
      memberProfile: {
        create: {
          status: 'PENDING',
          serialNumber: placeholderSerial,
          academicYear: getCurrentAcademicYear(),
        },
      },
    },
    include: { memberProfile: true },
  });
}

export async function getDigitalCard(userId: string) {
  const profile = await prisma.memberProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error('Member profile not found');
  return { qrValue: buildQrValue(userId), serialNumber: profile.serialNumber };
}
