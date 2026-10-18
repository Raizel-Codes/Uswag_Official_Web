import type { MembershipStatus, OfficerPosition, UserRole } from '@prisma/client';
import { prisma } from '../config/db.js';
import {
  APPLICANT_DAYS,
  APPLICANT_EXTENSION_DAYS,
  APPLICANT_WARNING_DAYS,
  MEMBERSHIP_FEE,
  PARTIAL_PAYMENT_MONTHS,
} from '../config/fee.js';
import { currentAcademicYear } from '../utils/academicYear.js';
import { logAction } from './audit.service.js';

// The membership fee: who has paid it, who still owes, and what each state allows.
//
//   exempt   serving as an officer. They paid in the year before they were elected, and the fee is not
//            asked of someone in office. It is worked out from the position, never faked as a payment,
//            so the ledger only ever holds money that was really received. Once they leave office the
//            normal yearly renewal (and fee) applies to them like anyone else.
//   paid     recorded payments for the year add up to the fee.
//   partial  paid something, not all; the rest is due PARTIAL_PAYMENT_MONTHS after the FIRST payment.
//   overdue  that time ran out. Can't be approved or renewed until the balance is paid, and the daily
//            job (jobs/feeEnforcement.job.ts) returns an active member to PENDING.
//   unpaid   nothing recorded.
//
// The Secretary can approve or renew only exempt / paid / partial. That rule lives in
// assertCanActivate(), called from the member service itself, so no route (not even the Super Admin's)
// reaches ACTIVE around it.

export type FeeState = 'exempt' | 'paid' | 'partial' | 'overdue' | 'unpaid';

export interface FeeInfo {
  state: FeeState;
  /** Pesos recorded for this membership year. */
  paid: number;
  /** Pesos still owed (0 when paid or exempt). */
  due: number;
  /** For partial / overdue: when the balance had to be (or must be) paid by. */
  deadline: Date | null;
}

export const canActivate = (state: FeeState) => state === 'exempt' || state === 'paid' || state === 'partial';

export class FeeRequiredError extends Error {
  constructor(message: string, readonly details?: unknown) {
    super(message);
  }
}

const toCents = (pesos: number) => Math.round(pesos * 100);
const fromCents = (cents: number) => cents / 100;

/** `date` plus whole months, staying inside the month (31 Jan + 1 month is 28/29 Feb, not 3 March). */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

export const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);

/** The whole rule, with no database in it. */
export function computeFee(payments: { amount: number; createdAt: Date }[], exempt: boolean, now: Date = new Date(), fee: number = MEMBERSHIP_FEE): FeeInfo {
  const paidCents = payments.reduce((sum, p) => sum + toCents(p.amount), 0);
  const paid = fromCents(paidCents);
  if (exempt) return { state: 'exempt', paid, due: 0, deadline: null };
  if (paidCents >= toCents(fee)) return { state: 'paid', paid, due: 0, deadline: null };
  const due = fromCents(toCents(fee) - Math.max(0, paidCents));
  if (paidCents <= 0) return { state: 'unpaid', paid: 0, due, deadline: null };
  const first = payments.reduce((a, b) => (a.createdAt <= b.createdAt ? a : b)).createdAt;
  const deadline = addMonths(first, PARTIAL_PAYMENT_MONTHS);
  return { state: now > deadline ? 'overdue' : 'partial', paid, due, deadline };
}

export interface FeeSubject {
  id: string;
  status: MembershipStatus;
  academicYear: string;
  joinedAt: Date;
  qrIssuedAt: Date | null;
  graceUntil: Date | null;
  user: { role: UserRole; officerPosition: OfficerPosition | null; isDeveloper: boolean };
}

/** In office now: a Super Admin / VP / Officer Admin with a position. (The developer's account is not an officer.) */
export function isServingOfficer(u: FeeSubject['user']): boolean {
  return !u.isDeveloper && (u.role === 'SUPER_ADMIN' || u.role === 'OFFICER_ADMIN') && u.officerPosition !== null;
}

/**
 * Which membership years' payments count toward this person right now. A pending application also
 * counts the year it was made in (someone who applied and paid just before 1 June, and is approved just
 * after, isn't asked twice); an expired membership counts the new year only, so last year's payment
 * never covers this year's renewal.
 */
function coveredYears(p: Pick<FeeSubject, 'status' | 'academicYear'>, now: Date): string[] {
  const current = currentAcademicYear(now);
  if (p.status === 'PENDING') return [...new Set([current, p.academicYear])];
  if (p.status === 'ACTIVE') return [p.academicYear];
  return [current];
}

/** Fee standing for many members with two queries. */
export async function feeFor(subjects: FeeSubject[], now: Date = new Date()): Promise<Map<string, FeeInfo>> {
  const ids = subjects.map((s) => s.id);
  const payments = ids.length
    ? await prisma.financeEntry.findMany({
        where: { type: 'DUES', relatedMemberId: { in: ids } },
        select: { relatedMemberId: true, amount: true, createdAt: true, academicYear: true },
      })
    : [];
  const byMember = new Map<string, typeof payments>();
  for (const p of payments) {
    const list = byMember.get(p.relatedMemberId!) ?? [];
    list.push(p);
    byMember.set(p.relatedMemberId!, list);
  }
  const out = new Map<string, FeeInfo>();
  for (const s of subjects) {
    const years = coveredYears(s, now);
    const mine = (byMember.get(s.id) ?? []).filter((p) => p.academicYear !== null && years.includes(p.academicYear));
    out.set(s.id, computeFee(mine, isServingOfficer(s.user), now));
  }
  return out;
}

const SUBJECT_SELECT = {
  id: true,
  status: true,
  academicYear: true,
  joinedAt: true,
  qrIssuedAt: true,
  graceUntil: true,
  user: { select: { id: true, name: true, role: true, officerPosition: true, isDeveloper: true } },
} as const;

// ─── Applicants: removed after APPLICANT_DAYS without a payment ───────────────────────────────────────

/** Someone who applied and was never approved. (Approval and account creation both stamp qrIssuedAt.) */
export const isApplicant = (p: Pick<FeeSubject, 'status' | 'qrIssuedAt'>) => p.status === 'PENDING' && p.qrIssuedAt === null;

/** When an unpaid application is removed: APPLICANT_DAYS after it was made, or the Treasurer's extension if later. */
export function applicantDeadline(p: Pick<FeeSubject, 'joinedAt' | 'graceUntil'>): Date {
  const base = addDays(p.joinedAt, APPLICANT_DAYS);
  return p.graceUntil && p.graceUntil > base ? p.graceUntil : base;
}

// ─── The Secretary's gate ─────────────────────────────────────────────────────────────────────────────

/**
 * Approving an application or renewing a membership needs the fee recorded first (or a serving
 * officer). `targetYear` is the year being approved into.
 */
export async function assertCanActivate(profileId: string, targetYear: string, now: Date = new Date()): Promise<void> {
  const profile = await prisma.memberProfile.findUnique({ where: { id: profileId }, select: SUBJECT_SELECT });
  if (!profile) return; // the caller reports "not found" itself
  const years = new Set([targetYear, ...(profile.status === 'PENDING' ? [profile.academicYear] : [])]);
  const payments = await prisma.financeEntry.findMany({
    where: { type: 'DUES', relatedMemberId: profile.id },
    select: { amount: true, createdAt: true, academicYear: true },
  });
  const info = computeFee(payments.filter((p) => p.academicYear !== null && years.has(p.academicYear)), isServingOfficer(profile.user), now);
  if (canActivate(info.state)) return;
  const name = profile.user.name;
  if (info.state === 'overdue') {
    throw new FeeRequiredError(
      `${name} didn’t pay the remaining ₱${info.due.toFixed(2)} within ${PARTIAL_PAYMENT_MONTHS} months of the first payment. The balance has to be paid and recorded by the Treasurer first.`,
      info,
    );
  }
  throw new FeeRequiredError(
    `${name} hasn’t paid the ₱${MEMBERSHIP_FEE.toFixed(2)} membership fee yet. The Treasurer records the payment first, then it can be approved.`,
    info,
  );
}

// ─── The Treasurer's roster and payments ──────────────────────────────────────────────────────────────

export interface RosterRow {
  id: string;
  name: string;
  collegeOrDept: string;
  serialNumber: string;
  status: Lowercase<MembershipStatus>;
  fee: { state: FeeState; paid: number; due: number; deadline: string | null };
  /** Unpaid applications only: the day the account is removed if nothing is recorded. */
  removedOn: string | null;
  isOfficer: boolean;
}

const ORDER: Record<FeeState, number> = { overdue: 0, unpaid: 1, partial: 2, paid: 3, exempt: 4 };

export const feeRules = () => ({
  amount: MEMBERSHIP_FEE,
  partialMonths: PARTIAL_PAYMENT_MONTHS,
  applicantDays: APPLICANT_DAYS,
  extensionDays: APPLICANT_EXTENSION_DAYS,
});

export function toFeeDTO(info: FeeInfo, removedOn: Date | null = null) {
  return { state: info.state, paid: info.paid, due: info.due, deadline: info.deadline?.toISOString() ?? null, removedOn: removedOn?.toISOString() ?? null };
}

/** Everyone who is, or is applying to be, a member (not the rejected, not the developer), unpaid first. */
export async function listRoster(now: Date = new Date()): Promise<{ rules: ReturnType<typeof feeRules>; members: RosterRow[] }> {
  const profiles = await prisma.memberProfile.findMany({
    where: { status: { not: 'REJECTED' }, user: { isDeveloper: false } },
    select: { ...SUBJECT_SELECT, serialNumber: true, user: { select: { id: true, name: true, role: true, officerPosition: true, isDeveloper: true, collegeOrDept: true } } },
  });
  const fees = await feeFor(profiles, now);
  const members: RosterRow[] = profiles.map((p) => {
    const info = fees.get(p.id)!;
    const removing = isApplicant(p) && info.state === 'unpaid';
    return {
      id: p.id,
      name: p.user.name,
      collegeOrDept: p.user.collegeOrDept,
      serialNumber: p.serialNumber,
      status: p.status.toLowerCase() as RosterRow['status'],
      fee: { state: info.state, paid: info.paid, due: info.due, deadline: info.deadline?.toISOString() ?? null },
      removedOn: removing ? applicantDeadline(p).toISOString() : null,
      isOfficer: isServingOfficer(p.user),
    };
  });
  members.sort((a, b) => ORDER[a.fee.state] - ORDER[b.fee.state] || (a.removedOn ?? '9').localeCompare(b.removedOn ?? '9') || a.name.localeCompare(b.name));
  return { rules: feeRules(), members };
}

export class PaymentError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

/** Records a membership-fee payment against one member. Partial payments are allowed; paying more than is owed is not. */
export async function recordMembershipPayment(actorId: string, input: { memberId: string; amount: number; note?: string }, now: Date = new Date()) {
  const profile = await prisma.memberProfile.findUnique({ where: { id: input.memberId }, select: SUBJECT_SELECT });
  if (!profile) throw new PaymentError('That member no longer exists.', 404);
  if (profile.status === 'REJECTED') throw new PaymentError('This application was not approved, so there is no fee to record.', 409);
  const before = (await feeFor([profile], now)).get(profile.id)!;
  if (before.state === 'exempt') throw new PaymentError(`${profile.user.name} is serving as an officer, so no fee is due.`, 409);
  if (before.state === 'paid') throw new PaymentError(`${profile.user.name} has already paid the full fee for this year.`, 409);
  const cents = toCents(input.amount);
  if (!(cents > 0)) throw new PaymentError('Enter an amount greater than zero.');
  if (cents > toCents(before.due)) throw new PaymentError(`${profile.user.name} only owes ₱${before.due.toFixed(2)}. Enter that or less.`);

  const entry = await prisma.financeEntry.create({
    data: {
      type: 'DUES',
      description: input.note ? `${profile.user.name} — Membership fee (${input.note})` : `${profile.user.name} — Membership fee`,
      amount: fromCents(cents),
      relatedMemberId: profile.id,
      academicYear: currentAcademicYear(now),
      recordedById: actorId,
    },
  });
  await logAction(actorId, 'finance.dues', 'FinanceEntry', entry.id, { memberName: profile.user.name, memberId: profile.id, amount: fromCents(cents) });
  const after = (await feeFor([profile], now)).get(profile.id)!;
  return { entry, fee: toFeeDTO(after) };
}

/** The Treasurer gives an unpaid application more time (a cash payment not yet written down, say). */
export async function extendApplicant(actorId: string, memberId: string, now: Date = new Date()) {
  const profile = await prisma.memberProfile.findUnique({ where: { id: memberId }, select: SUBJECT_SELECT });
  if (!profile) throw new PaymentError('That application no longer exists.', 404);
  if (!isApplicant(profile)) throw new PaymentError('Only an application that hasn’t been approved yet can be given more time.', 409);
  const current = applicantDeadline(profile);
  const graceUntil = addDays(current > now ? current : now, APPLICANT_EXTENSION_DAYS);
  await prisma.memberProfile.update({ where: { id: memberId }, data: { graceUntil, expiryWarnedAt: null } });
  await logAction(actorId, 'finance.extend', 'MemberProfile', memberId, { name: profile.user.name, until: graceUntil.toISOString() });
  return { removedOn: graceUntil.toISOString() };
}

export const APPLICANT_WARNING = APPLICANT_WARNING_DAYS;
