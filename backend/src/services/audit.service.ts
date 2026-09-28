import { prisma } from '../config/db.js';
import type { Prisma } from '@prisma/client';

// Called from controllers after any sensitive action (approvals, bylaws
// edits, officer changes). This is a record for the Auditor/Super Admin,
// not an enforcement mechanism — role.middleware.ts is what actually
// gates the action.
export function logAction(actorId: string, action: string, targetType?: string, targetId?: string, metadata?: Prisma.InputJsonValue) {
  return prisma.auditLogEntry.create({
    data: { actorId, action, targetType, targetId, metadata },
  });
}
