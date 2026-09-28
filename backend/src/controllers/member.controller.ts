import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
import * as memberService from '../services/member.service.js';
import * as attendanceService from '../services/attendance.service.js';
import { hashPassword } from '../services/auth.service.js';
import { logAction } from '../services/audit.service.js';
import { ok, fail } from '../utils/response.js';

type MemberProfileWithUser = Prisma.MemberProfileGetPayload<{ include: { user: true } }>;

// Flattens the Prisma MemberProfile+User join into the shape the frontend's
// MemberProfile type actually expects (name/email/collegeOrDept at the top
// level, lowercase status, a computed attendanceRate). Without this mapper
// the raw Prisma shape (nested `user`, uppercase `status`, no attendanceRate
// field at all) silently breaks every consumer that reads `.name` or
// compares `.status === 'active'`.
function toMemberDTO(profile: MemberProfileWithUser, attendanceRate: number) {
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
  };
}

export async function getMyProfile(req: Request, res: Response) {
  const profile = await prisma.memberProfile.findUnique({ where: { userId: req.user!.id }, include: { user: true } });
  if (!profile) return fail(res, 'Member profile not found', 404);
  const rates = await attendanceService.getAttendanceRatesByMember([profile.id]);
  return ok(res, toMemberDTO(profile, rates[profile.id] ?? 0));
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
  const rates = await attendanceService.getAttendanceRatesByMember(members.map((m) => m.id));
  return ok(res, members.map((m) => toMemberDTO(m, rates[m.id] ?? 0)));
}

// Scope: Secretary (or Super Admin) only — enforced via requireOfficerPosition('SECRETARY')
// in member.routes.ts.
export async function approveApplication(req: Request, res: Response) {
  const { memberId } = req.params;
  const updated = await memberService.approveApplication(memberId, req.body.academicYear);
  await logAction(req.user!.id, 'member.approve', 'MemberProfile', memberId);
  return ok(res, updated);
}

export async function rejectApplication(req: Request, res: Response) {
  const { memberId } = req.params;
  const updated = await prisma.memberProfile.update({ where: { userId: memberId }, data: { status: 'REJECTED' } });
  await logAction(req.user!.id, 'member.reject', 'MemberProfile', memberId, { reason: req.body.reason });
  return ok(res, updated);
}

// Public — no auth. See member.routes.ts (registered before requireAuth)
// and memberSchemas.ts's submitApplicationSchema for validation.
export async function submitApplication(req: Request, res: Response) {
  const { name, email, password, collegeOrDept, yearLevel, website } = req.body;

  // Honeypot: a real applicant never sees this field (it's visually hidden
  // and aria-hidden in ApplicationPage.tsx); a script that blindly fills
  // every input on the form does. Fake a normal-looking success response
  // without touching the database, so the script has no signal that it was
  // caught rather than that the application genuinely went through.
  if (website) {
    return ok(res, { id: crypto.randomUUID(), email, status: 'pending' }, 201);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return fail(res, 'An account with this email already exists. Try logging in instead.', 409);
  }

  const passwordHash = await hashPassword(password);
  const user = await memberService.submitApplication({ name, email, passwordHash, collegeOrDept, yearLevel });
  return ok(res, { id: user.id, email: user.email, status: 'pending' }, 201);
}

export async function getMyQr(req: Request, res: Response) {
  const card = await memberService.getDigitalCard(req.user!.id);
  return ok(res, card);
}
