import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { logAction } from '../services/audit.service.js';
import { ok } from '../utils/response.js';

// SUPER ADMIN ONLY — see role.middleware.ts requireRole('SUPER_ADMIN')
// applied in officer.routes.ts.
export async function listOfficers(_req: Request, res: Response) {
  const officers = await prisma.user.findMany({ where: { role: { in: ['OFFICER_ADMIN', 'SUPER_ADMIN'] } } });
  return ok(res, officers);
}

export async function assignOfficer(req: Request, res: Response) {
  const { userId, officerPosition } = req.body;
  const updated = await prisma.user.update({ where: { id: userId }, data: { role: 'OFFICER_ADMIN', officerPosition } });
  await logAction(req.user!.id, 'officer.assign', 'User', userId, { officerPosition });
  return ok(res, updated);
}

// PUBLIC READ — for landing pages and public officer roster
export async function listPublicOfficers(_req: Request, res: Response) {
  const officers = await prisma.user.findMany({
    where: { role: { in: ['OFFICER_ADMIN', 'SUPER_ADMIN'] } },
    select: {
      id: true,
      name: true,
      officerPosition: true,
      collegeOrDept: true,
    },
  });
  return ok(res, officers);
}
