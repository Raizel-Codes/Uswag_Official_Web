import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { logAction } from '../services/audit.service.js';
import { ok, fail } from '../utils/response.js';

// ---------------------------------------------------------------------------
// GET /finance/summary
// Access: Treasurer + Auditor + Super Admin (read-only for Auditor)
// ---------------------------------------------------------------------------
export async function getFinanceSummary(req: Request, res: Response) {
  const [entries, pendingCount, activeCount] = await Promise.all([
    prisma.financeEntry.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.memberProfile.count({ where: { status: 'PENDING' } }),
    prisma.memberProfile.count({ where: { status: 'ACTIVE' } }),
  ]);

  const totalDues = entries
    .filter((e) => e.type === 'DUES')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = entries
    .filter((e) => e.type === 'EXPENSE')
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);

  const fundsOnHand = totalDues - totalExpenses;

  return ok(res, {
    fundsOnHand,
    totalDues,
    totalExpenses,
    activeMembers: activeCount,
    pendingApplications: pendingCount,
  });
}

// ---------------------------------------------------------------------------
// GET /finance/entries
// Access: Treasurer + Auditor + Super Admin
// ---------------------------------------------------------------------------
export async function listFinanceEntries(req: Request, res: Response) {
  const { type, limit = '30' } = req.query;

  const entries = await prisma.financeEntry.findMany({
    where: type ? { type: String(type).toUpperCase() } : undefined,
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
    include: {
      recordedBy: {
        select: { id: true, name: true },
      },
    },
  });

  return ok(res, entries);
}

// ---------------------------------------------------------------------------
// POST /finance/dues
// Access: Treasurer + Super Admin ONLY — Auditor blocked by requireOfficerPosition
// Body: { memberName: string; memberId?: string; amount: number; note?: string }
// ---------------------------------------------------------------------------
export async function recordDues(req: Request, res: Response) {
  const { memberName, memberId, amount, note } = req.body;

  if (!memberName || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return fail(res, 'memberName and a positive amount are required', 400);
  }

  const entry = await prisma.financeEntry.create({
    data: {
      type: 'DUES',
      description: note ? `${memberName} — ${note}` : `${memberName} — Dues`,
      amount: Number(amount),
      relatedMemberId: memberId ?? null,
      recordedById: req.user!.id,
    },
  });

  await logAction(req.user!.id, 'finance.dues', 'FinanceEntry', entry.id, {
    memberName,
    amount: Number(amount),
  });

  return ok(res, entry, 201);
}

// ---------------------------------------------------------------------------
// POST /finance/expense
// Access: Treasurer + Super Admin ONLY
// Body: { description: string; amount: number }
// ---------------------------------------------------------------------------
export async function recordExpense(req: Request, res: Response) {
  const { description, amount } = req.body;

  if (!description || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return fail(res, 'description and a positive amount are required', 400);
  }

  const entry = await prisma.financeEntry.create({
    data: {
      type: 'EXPENSE',
      description,
      amount: -Math.abs(Number(amount)), // stored negative
      recordedById: req.user!.id,
    },
  });

  await logAction(req.user!.id, 'finance.expense', 'FinanceEntry', entry.id, {
    description,
    amount: Number(amount),
  });

  return ok(res, entry, 201);
}
