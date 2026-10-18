import type { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { logAction } from '../services/audit.service.js';
import { ok, fail } from '../utils/response.js';
import { PaymentError, extendApplicant, getMembershipFee, listRoster, recordMembershipPayment, setMembershipFee } from '../services/fee.service.js';

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
// GET /finance/roster
// Access: Treasurer + Auditor (read-only) + Super Admin
// Everyone who is or is applying to be a member, with their membership-fee standing:
// the Treasurer's "who has paid" list and the picker behind the record-a-payment form.
// ---------------------------------------------------------------------------
export async function getFeeRoster(_req: Request, res: Response) {
  return ok(res, await listRoster());
}

// ---------------------------------------------------------------------------
// GET /finance/membership-fee
// Access: PUBLIC — the Join Us and Application pages quote the current fee. Just the amount and since when;
// never who set it. Never cached, so a change by the Treasurer shows on the next load.
// ---------------------------------------------------------------------------
export async function getCurrentMembershipFee(_req: Request, res: Response) {
  res.set('Cache-Control', 'no-store');
  return ok(res, await getMembershipFee());
}

// ---------------------------------------------------------------------------
// PUT /finance/membership-fee
// Access: Treasurer + Super Admin ONLY
// Body: { amount: number } — pesos, at most two decimals. Applies from now; recorded in the audit log.
// ---------------------------------------------------------------------------
export async function updateMembershipFee(req: Request, res: Response) {
  const amount = typeof req.body?.amount === 'string' ? Number(req.body.amount) : req.body?.amount;
  if (typeof amount !== 'number') return fail(res, 'Enter the new fee in pesos.', 400);
  try {
    return ok(res, await setMembershipFee(req.user!.id, amount));
  } catch (err) {
    if (err instanceof PaymentError) return fail(res, err.message, err.status);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// POST /finance/dues
// Access: Treasurer + Super Admin ONLY — Auditor blocked by requireOfficerPosition
// Body: { memberId: string (MemberProfile.id); amount: number; note?: string }
// A membership-fee payment against one member. Part payments are fine; more than is owed, a member
// who has paid in full, and a serving officer (no fee) are refused (services/fee.service.ts).
// ---------------------------------------------------------------------------
export async function recordDues(req: Request, res: Response) {
  const { memberId, amount, note } = req.body;
  if (typeof memberId !== 'string' || !memberId) return fail(res, 'Choose the member who paid.', 400);
  if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0) return fail(res, 'Enter an amount greater than zero.', 400);
  try {
    const { entry, fee } = await recordMembershipPayment(req.user!.id, { memberId, amount: Number(amount), note: typeof note === 'string' && note.trim() ? note.trim().slice(0, 120) : undefined });
    return ok(res, { ...entry, fee }, 201);
  } catch (err) {
    if (err instanceof PaymentError) return fail(res, err.message, err.status);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// POST /finance/roster/:memberId/extend
// Access: Treasurer + Super Admin ONLY
// More time for an unpaid application before it is removed (a cash payment not yet written down).
// ---------------------------------------------------------------------------
export async function extendApplication(req: Request, res: Response) {
  try {
    return ok(res, await extendApplicant(req.user!.id, req.params.memberId));
  } catch (err) {
    if (err instanceof PaymentError) return fail(res, err.message, err.status);
    throw err;
  }
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
