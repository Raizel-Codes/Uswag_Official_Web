import type { Request, Response, NextFunction } from 'express';
import type { UserRole, OfficerPosition } from '@prisma/client';
import { prisma } from '../config/db.js';
import { fail } from '../utils/response.js';


function isSuperAdminEquivalent(user: { role: UserRole; officerPosition?: OfficerPosition | null }) {
  return user.role === 'SUPER_ADMIN' || user.officerPosition === 'VICE_PRESIDENT';
}

export function requireRole(...allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return fail(res, 'Not authenticated', 401);
    if (allowed.includes('SUPER_ADMIN') && isSuperAdminEquivalent(req.user)) return next();
    if (!allowed.includes(req.user.role)) {
      return fail(res, 'You do not have permission to perform this action', 403);
    }
    next();
  };
}

export function requireOfficerPosition(...allowed: OfficerPosition[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return fail(res, 'Not authenticated', 401);
    if (isSuperAdminEquivalent(req.user)) return next();
    if (req.user.role === 'OFFICER_ADMIN' && req.user.officerPosition && allowed.includes(req.user.officerPosition)) {
      return next();
    }
    return fail(res, 'This action is outside your officer role\'s scope', 403);
  };
}

// The /dev console. Checked against the database on every request, not the token: a token outlives
// the account it was issued for, and this is the one door that must close the moment the flag goes.
export async function requireDeveloper(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return fail(res, 'Not authenticated', 401);
  const account = await prisma.user.findUnique({ where: { id: req.user.id }, select: { isDeveloper: true } });
  if (!account?.isDeveloper) return fail(res, 'You do not have permission to perform this action', 403);
  next();
}
