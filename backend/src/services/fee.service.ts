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
// The amount is set by the Treasurer (setMembershipFee) and kept as a history of rates. A member is judged
// against the fee in force when their first payment for the year was recorded (today, if they haven't paid),
// so raising or lowering the fee never turns someone who already paid in full into a debtor.
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
  /** The full fee this member is judged against (see the note above about which rate applies). */
  amount: number;
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

export interface FeeRate {
  amount: number;
  effectiveFrom: Date;
}

/** The fee in force at `at`: the newest rate that had started by then, else the starting fee in config/fee.ts. */
export function rateAt(rates: FeeRate[], at: Date): number {
  let found: FeeRate | undefined;
  for (const r of rates) if (r.effectiveFrom <= at && (!found || r.effectiveFrom > found.effectiveFrom)) found = r;
  return found ? found.amount : MEMBERSHIP_FEE;
}

/** The rates, oldest first. A handful of rows at most (one per change the Treasurer makes). */
export const loadRates = (): Promise<FeeRate[]> => prisma.membershipFeeRate.findMany({ select: { amount: true, effectiveFrom: true }, orderBy: { effectiveFrom: 'asc' } });

/** The whole rule, with no database in it. */
export function computeFee(payments: { amount: number; createdAt: Date }[], exempt: boolean, now: Date = new Date(), rates: FeeRate[] = []): FeeInfo {
  const first = payments.length > 0 ? payments.reduce((a, b) => (a.createdAt <= b.createdAt ? a : b)).createdAt : null;
  const fee = rateAt(rates, first ?? now);
  const paidCents = payments.reduce((sum, p) => sum + toCents(p.amount), 0);
  const paid = fromCents(paidCents);
  if (exempt) return { state: 'exempt', paid, due: 0, amount: fee, deadline: null };
  if (paidCents >= toCents(fee)) return { state: 'paid', paid, due: 0, amount: fee, deadline: null };
  const due = fromCents(toCents(fee) - Math.max(0, paidCents));
  if (paidCents <= 0 || !first) return { state: 'unpaid', paid: 0, due, amount: fee, deadline: null };
  const deadline = addMonths(first, PARTIAL_PAYMENT_MONTHS);
  return { state: now > deadline ? 'overdue' : 'partial', paid, due, amount: fee, deadline };
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
  const rates = await loadRates();
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
    out.set(s.id, computeFee(mine, isServingOfficer(s.user), now, rates));
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
  const info = computeFee(payments.filter((p) => p.academicYear !== null && years.has(p.academicYear)), isServingOfficer(profile.user), now, await loadRates());
  if (canActivate(info.state)) return;
  const name = profile.user.name;
  if (info.state === 'overdue') {
    throw new FeeRequiredError(
      `${name} didn’t pay the remaining ₱${info.due.toFixed(2)} within ${PARTIAL_PAYMENT_MONTHS} months of the first payment. The balance has to be paid and recorded by the Treasurer first.`,
      info,
    );
  }
  throw new FeeRequiredError(
    `${name} hasn’t paid the ₱${info.amount.toFixed(2)} membership fee yet. The Treasurer records the payment first, then it can be approved.`,
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

export interface FeeChange {
  amount: number;
  effectiveFrom: string;
  setBy: string | null;
}

/** The fee in force right now, and since when (null = still the starting fee). */
export async function getMembershipFee(now: Date = new Date()): Promise<{ amount: number; since: string | null }> {
  const rates = await loadRates();
  const current = rates.filter((r) => r.effectiveFrom <= now).pop();
  return { amount: rateAt(rates, now), since: current?.effectiveFrom.toISOString() ?? null };
}

/** What the Treasurer sees: the fee now plus the last few changes and who made them. */
async function feeRules(now: Date) {
  const [{ amount, since }, rows] = await Promise.all([
    getMembershipFee(now),
    prisma.membershipFeeRate.findMany({ orderBy: { effectiveFrom: 'desc' }, take: 5 }),
  ]);
  const setters = rows.flatMap((r) => (r.setById ? [r.setById] : []));
  const names = new Map((setters.length ? await prisma.user.findMany({ where: { id: { in: setters } }, select: { id: true, name: true } }) : []).map((u) => [u.id, u.name]));
  const history: FeeChange[] = rows.map((r) => ({ amount: r.amount, effectiveFrom: r.effectiveFrom.toISOString(), setBy: r.setById ? names.get(r.setById) ?? null : null }));
  return {
    amount,
    since,
    history,
    partialMonths: PARTIAL_PAYMENT_MONTHS,
    applicantDays: APPLICANT_DAYS,
    extensionDays: APPLICANT_EXTENSION_DAYS,
  };
}

export function toFeeDTO(info: FeeInfo, removedOn: Date | null = null) {
  return { state: info.state, paid: info.paid, due: info.due, deadline: info.deadline?.toISOString() ?? null, removedOn: removedOn?.toISOString() ?? null };
}

/** Everyone who is, or is applying to be, a member (not the rejected, not the developer), unpaid first. */
export async function listRoster(now: Date = new Date()): Promise<{ rules: Awaited<ReturnType<typeof feeRules>>; members: RosterRow[] }> {
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
  return { rules: await feeRules(now), members };
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

export const MAX_MEMBERSHIP_FEE = 10_000;

/**
 * The Treasurer sets a new membership fee. It applies from now: payments already recorded keep the fee
 * they were made under (see computeFee), and everyone else is asked for the new amount. Article III has
 * the officers set the fee and the adviser approve it, so the page tells the Treasurer to get that first.
 */
export async function setMembershipFee(actorId: string, amount: number, now: Date = new Date()) {
  if (!Number.isFinite(amount) || toCents(amount) <= 0) throw new PaymentError('Enter a fee greater than zero.');
  if (Math.abs(amount * 100 - toCents(amount)) > 1e-6) throw new PaymentError('Use at most two decimal places (centavos).');
  if (amount > MAX_MEMBERSHIP_FEE) throw new PaymentError(`A membership fee above ₱${MAX_MEMBERSHIP_FEE.toLocaleString('en-PH')} looks like a typing mistake.`);
  const next = fromCents(toCents(amount));
  const before = (await getMembershipFee(now)).amount;
  if (next === before) throw new PaymentError(`The membership fee is already ₱${before.toFixed(2)}.`, 409);
  const row = await prisma.membershipFeeRate.create({ data: { amount: next, effectiveFrom: now, setById: actorId } });
  await logAction(actorId, 'finance.fee.set', 'MembershipFeeRate', row.id, { from: before, to: next });
  return { amount: next, since: row.effectiveFrom.toISOString() };
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
