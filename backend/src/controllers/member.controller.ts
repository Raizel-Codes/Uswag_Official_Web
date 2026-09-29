import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import * as memberService from '../services/member.service.js';
import * as attendanceService from '../services/attendance.service.js';
import { hashPassword, createPasswordResetToken } from '../services/auth.service.js';
import { logAction } from '../services/audit.service.js';
import { hashStudentId, decryptStudentId } from '../utils/crypto.js';
import { ok, fail } from '../utils/response.js';

type MemberProfileWithUser = Prisma.MemberProfileGetPayload<{ include: { user: true } }>;

// Flattens the Prisma MemberProfile+User join into the shape the frontend's
// MemberProfile type actually expects (name/email/collegeOrDept at the top
// level, lowercase status, a computed attendanceRate). Without this mapper
// the raw Prisma shape (nested `user`, uppercase `status`, no attendanceRate
// field at all) silently breaks every consumer that reads `.name` or
// compares `.status === 'active'`.
function toMemberDTO(profile: MemberProfileWithUser, attendanceRate: number, nameMatches = 0) {
  return {
    id: profile.id,
    serialNumber: profile.serialNumber,
    name: profile.user.name,
    email: profile.user.email,
    collegeOrDept: profile.user.collegeOrDept,
    yearLevel: profile.user.yearLevel,
    status: profile.status.toLowerCase(),
    academicYear: profile.academicYear,
    attendanceRate,
    joinedAt: profile.joinedAt,
    // Review aids for the Secretary. Never the student ID itself — that is
    // only returned (decrypted) by revealStudentId, one audited request at a time.
    studentIdOnFile: profile.studentIdCiphertext !== null,
    submittedByProxy: profile.submittedByProxy,
    proxyName: profile.proxyName,
    awaitingPasswordSetup: profile.user.awaitingPasswordSetup,
    nameMatches,
  };
}

/** Case/space-insensitive name key: "Maria  santos" === "Maria Santos". */
function nameKey(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

// For each PENDING application, how many *other* member accounts carry the
// same name. A flag for the Secretary, never a block: two real students can
// share a name, and the student ID is what actually decides.
async function countNameMatches(profiles: MemberProfileWithUser[]): Promise<Record<string, number>> {
  const pending = profiles.filter((p) => p.status === 'PENDING');
  if (pending.length === 0) return {};
  const everyone = await prisma.user.findMany({ where: { role: 'MEMBER' }, select: { name: true } });
  const byName = new Map<string, number>();
  for (const u of everyone) byName.set(nameKey(u.name), (byName.get(nameKey(u.name)) ?? 0) + 1);
  return Object.fromEntries(pending.map((p) => [p.id, Math.max(0, (byName.get(nameKey(p.user.name)) ?? 1) - 1)]));
}

export async function getMyProfile(req: Request, res: Response) {
  const profile = await prisma.memberProfile.findUnique({ where: { userId: req.user!.id }, include: { user: true } });
  if (!profile) return fail(res, 'Member profile not found', 404);
  const rates = await attendanceService.getAttendanceRatesByMember([profile.id]);
  // standingNote: why the card / event sign-ups are locked (null when active).
  return ok(res, { ...toMemberDTO(profile, rates[profile.id] ?? 0), standingNote: memberService.standingBlock(profile.status) });
}

export async function listMembers(req: Request, res: Response) {
  const { status, search } = req.query;
  const members = await prisma.memberProfile.findMany({
    where: {
      status: status ? (String(status).toUpperCase() as any) : undefined,
      user: search ? { name: { contains: String(search), mode: 'insensitive' } } : undefined,
    },
    include: { user: true },
    orderBy: { joinedAt: 'desc' },
  });
  const [rates, nameMatches] = await Promise.all([
    attendanceService.getAttendanceRatesByMember(members.map((m) => m.id)),
    countNameMatches(members),
  ]);
  return ok(res, members.map((m) => toMemberDTO(m, rates[m.id] ?? 0, nameMatches[m.id] ?? 0)));
}

async function findPending(profileId: string) {
  const profile = await prisma.memberProfile.findUnique({ where: { id: profileId } });
  if (!profile) return { ok: false as const, status: 404, message: 'Application not found' };
  if (profile.status !== 'PENDING') return { ok: false as const, status: 409, message: 'This application has already been handled' };
  return { ok: true as const, profile };
}

// Scope: Secretary (or Super Admin) only — enforced via requireOfficerPosition('SECRETARY')
// in member.routes.ts. :memberId is the MemberProfile id (what toMemberDTO
// returns as `id`, and what every admin page sends).
export async function approveApplication(req: Request, res: Response) {
  const { memberId } = req.params;
  const pending = await findPending(memberId);
  if (!pending.ok) return fail(res, pending.message, pending.status);
  const updated = await memberService.approveApplication(memberId, req.body.academicYear);
  await logAction(req.user!.id, 'member.approve', 'MemberProfile', memberId, { viaProxy: pending.profile.submittedByProxy });
  return ok(res, decisionDTO(updated));
}

export async function rejectApplication(req: Request, res: Response) {
  const { memberId } = req.params;
  const pending = await findPending(memberId);
  if (!pending.ok) return fail(res, pending.message, pending.status);
  const updated = await memberService.rejectApplication(memberId);
  await logAction(req.user!.id, 'member.reject', 'MemberProfile', memberId, { reason: req.body.reason });
  return ok(res, decisionDTO(updated));
}

// What an approve/reject response carries — not the raw row (it holds the student-ID
// fingerprint and QR bookkeeping the client has no use for).
function decisionDTO(p: { id: string; status: string; serialNumber: string; academicYear: string }) {
  return { id: p.id, status: p.status.toLowerCase(), serialNumber: p.serialNumber, academicYear: p.academicYear };
}

// Secretary only. Decrypts the student ID of an application under review so
// it can be checked against the applicant's school ID. Every view is
// audit-logged. Once the application is approved or rejected the ciphertext
// no longer exists, so this returns 410.
export async function revealStudentId(req: Request, res: Response) {
  const { memberId } = req.params;
  const profile = await prisma.memberProfile.findUnique({ where: { id: memberId } });
  if (!profile) return fail(res, 'Application not found', 404);
  if (!profile.studentIdCiphertext) {
    return fail(res, 'No student ID on file. It is deleted once an application is approved or rejected.', 410);
  }
  let studentId: string;
  try {
    studentId = decryptStudentId(profile.studentIdCiphertext);
  } catch {
    return fail(res, 'This student ID could not be decrypted. Check STUDENT_ID_ENC_KEY on the server.', 500);
  }
  await logAction(req.user!.id, 'member.studentId.view', 'MemberProfile', memberId);
  return ok(res, { studentId });
}

// Secretary only. For friend-assisted applications the applicant never set a
// password, so the Secretary generates a one-time link (the same 1-hour token
// as /forgot-password) and hands it over in person. Refused for every other
// account, so this can't become a way to take over someone's login.
export async function createSetupLink(req: Request, res: Response) {
  const { memberId } = req.params;
  const profile = await prisma.memberProfile.findUnique({ where: { id: memberId }, include: { user: true } });
  if (!profile) return fail(res, 'Member not found', 404);
  if (!profile.user.awaitingPasswordSetup) {
    return fail(res, 'This member has already set their own password. They can use “Forgot password” if they lost it.', 409);
  }
  const rawToken = await createPasswordResetToken(profile.userId);
  await logAction(req.user!.id, 'member.setupLink.create', 'MemberProfile', memberId);
  return ok(res, { url: `${env.frontendOrigin}/reset-password?token=${rawToken}`, expiresInMinutes: 60 });
}

const DUPLICATE_EMAIL_MESSAGE = 'An account with this email already exists. Try logging in instead.';
const DUPLICATE_ID_MESSAGE =
  'An application with this student ID has already been submitted. Log in to check its status, or contact the Secretary if you think this is a mistake.';

// Public — no auth. See member.routes.ts (registered before requireAuth)
// and memberSchemas.ts's submitApplicationSchema for validation.
export async function submitApplication(req: Request, res: Response) {
  const { name, email, studentId, password, collegeOrDept, yearLevel, onBehalf, website } = req.body;

  // Honeypot: a real applicant never sees this field (it's visually hidden
  // and aria-hidden in ApplicationPage.tsx); a script that blindly fills
  // every input on the form does. Fake a normal-looking success response
  // without touching the database, so the script has no signal that it was
  // caught rather than that the application genuinely went through.
  if (website) {
    return ok(res, { id: crypto.randomUUID(), email, status: 'pending' }, 201);
  }

  // Case-insensitive: older accounts may have been stored with capitals.
  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
  if (existing) return fail(res, DUPLICATE_EMAIL_MESSAGE, 409);

  // One application per student ID, whatever email or device is used.
  const sameId = await prisma.memberProfile.findUnique({ where: { studentIdHash: hashStudentId(studentId) } });
  if (sameId) return fail(res, DUPLICATE_ID_MESSAGE, 409);

  // Friend-assisted: nobody knows this password; it only exists so the
  // column isn't empty. The applicant sets a real one via createSetupLink.
  const passwordHash = await hashPassword(onBehalf ? crypto.randomBytes(32).toString('hex') : password);
  try {
    const user = await memberService.submitApplication({
      name,
      email,
      passwordHash,
      collegeOrDept,
      yearLevel,
      studentId,
      proxyName: onBehalf?.helperName,
    });
    return ok(res, { id: user.id, email: user.email, status: 'pending' }, 201);
  } catch (err: any) {
    // Two submissions racing past the checks above: the unique indexes decide.
    if (err?.code === 'P2002') {
      const target = String(err.meta?.target ?? '');
      return fail(res, target.includes('studentIdHash') ? DUPLICATE_ID_MESSAGE : DUPLICATE_EMAIL_MESSAGE, 409);
    }
    throw err;
  }
}

// Only ACTIVE members are issued a signed QR (Article III). A pending,
// expired or rejected member gets 403 + the reason; the QR is never
// generated for them, not just hidden by the frontend.
export async function getMyQr(req: Request, res: Response) {
  const profile = await prisma.memberProfile.findUnique({ where: { userId: req.user!.id } });
  if (!profile) return fail(res, 'Member profile not found', 404);
  const blocked = memberService.standingBlock(profile.status);
  if (blocked) return fail(res, blocked, 403, { standing: profile.status.toLowerCase() });
  const card = await memberService.getDigitalCard(req.user!.id);
  return ok(res, card);
}
