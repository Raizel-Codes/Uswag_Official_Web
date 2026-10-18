import type { FeeStanding, FeeState } from '@/types/finance.types';

// How the membership-fee standing reads in the admin consoles. The rules themselves (the 3 months, the
// 7 days) live on the server, backend/src/config/fee.ts, and the fee amount is set by the Treasurer
// (stored in the database); the numbers shown here come from what the server sends, never from a copy.

export const FEE_LABEL: Record<FeeState, string> = {
  exempt: 'Officer · no fee',
  paid: 'Paid',
  partial: 'Partly paid',
  overdue: 'Overdue',
  unpaid: 'Unpaid',
};

/** The existing standing chips: green, amber, red. */
export const FEE_TONE: Record<FeeState, string> = {
  exempt: 'mp-standing--active',
  paid: 'mp-standing--active',
  partial: 'mp-standing--pending',
  overdue: 'mp-standing--rejected',
  unpaid: 'mp-standing--expired',
};

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });

/** Approve and renew need the fee recorded (or a serving officer). The server enforces it; this only explains it. */
export const feeAllowsActivation = (fee?: FeeStanding) => !fee || fee.state === 'exempt' || fee.state === 'paid' || fee.state === 'partial';

/** Whole days from now until `iso` (0 once it has passed). */
export function daysUntil(iso: string, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now.getTime()) / 86_400_000));
}

/** One short line for a row: what was paid, what is left, by when. */
export function feeDetail(fee: FeeStanding): string {
  switch (fee.state) {
    case 'exempt':
      return 'Serving as an officer';
    case 'paid':
      return `${peso(fee.paid)} paid`;
    case 'partial':
      return `${peso(fee.paid)} paid · ${peso(fee.due)} left by ${fee.deadline ? day(fee.deadline) : 'the deadline'}`;
    case 'overdue':
      return `${peso(fee.paid)} paid · ${peso(fee.due)} was due ${fee.deadline ? day(fee.deadline) : ''}`.trim();
    default:
      return fee.removedOn ? `Nothing paid · removed ${day(fee.removedOn)} (${daysUntil(fee.removedOn)} days)` : 'Nothing paid yet';
  }
}

/** Why the Secretary can't approve / renew yet, in plain words. */
export function feeBlockedReason(fee?: FeeStanding): string | null {
  if (feeAllowsActivation(fee)) return null;
  return fee?.state === 'overdue'
    ? 'The balance wasn’t paid in time. The Treasurer has to record it before this can be approved.'
    : 'The Treasurer has to record the membership fee before this can be approved.';
}

export { peso };
