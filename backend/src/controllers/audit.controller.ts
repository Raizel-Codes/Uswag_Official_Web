import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { ok } from '../utils/response.js';

// SUPER ADMIN full view; Auditor gets a narrower read via
// finance/attendance-specific endpoints rather than this raw log,
// per claude.md's Auditor scope (financial + attendance records only).
export async function listAuditLog(req: Request, res: Response) {
  const { action, limit = '100' } = req.query;

  const entries = await prisma.auditLogEntry.findMany({
    where: action ? { action: { contains: String(action), mode: 'insensitive' } } : undefined,
    orderBy: { createdAt: 'desc' },
    take: Math.min(Number(limit), 500),
    include: {
      actor: {
        select: { id: true, name: true, role: true, officerPosition: true },
      },
    },
  });

  return ok(res, entries);
}
