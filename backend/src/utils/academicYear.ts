import type { MembershipStatus } from '@prisma/client';

// Article III §3: "Membership is valid for one academic year and is renewable annually."
// The Constitution doesn't give the year's start date. NwSSU's academic year is treated as
// starting on 1 June (the assumption this codebase already made in getCurrentAcademicYear), so a
// "2026-2027" membership lapses at the start of 1 June 2027. This is the ONE place that
// assumption lives — if the adviser or registrar confirms a different start, change it here.
export const ACADEMIC_YEAR_START_MONTH = 6; // 1-based: June
const TIME_ZONE = 'Asia/Manila'; // UTC+8 all year (no daylight saving)

/** Year and 1-based month of `now` on the wall clock in Manila, whatever timezone the server runs in. */
function manilaYearMonth(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric', month: 'numeric' }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month') };
}

/** e.g. "2026-2027" — the academic year `now` falls in. */
export function currentAcademicYear(now: Date = new Date()): string {
  const { year, month } = manilaYearMonth(now);
  const startYear = month >= ACADEMIC_YEAR_START_MONTH ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

/** The year a label like "2026-2027" starts in (2026). NaN when the label isn't in that shape. */
export function academicYearStart(label: string): number {
  return /^\d{4}-\d{4}$/.test(label) ? Number(label.slice(0, 4)) : NaN;
}

/** The instant a "2026-2027" membership ends: the start of the next academic year, Manila time. */
export function academicYearEnd(label: string): Date {
  const endYear = academicYearStart(label) + 1;
  const month = String(ACADEMIC_YEAR_START_MONTH).padStart(2, '0');
  return new Date(`${endYear}-${month}-01T00:00:00+08:00`);
}

interface Standing {
  status: MembershipStatus;
  academicYear: string;
  expiresAt: Date | null;
}

/**
 * An ACTIVE membership that has run past its academic year (or its own expiry date). The renewal
 * job writes EXPIRED for these once a day; this check is what the server uses in between, so a
 * lapsed member is never treated as active just because the job hasn't run yet.
 */
export function isLapsed(p: Standing, now: Date = new Date()): boolean {
  if (p.status !== 'ACTIVE') return false;
  if (p.expiresAt && p.expiresAt <= now) return true;
  return academicYearStart(p.academicYear) < academicYearStart(currentAcademicYear(now));
}

/** The status to act on: EXPIRED for a lapsed ACTIVE membership, else what's stored. */
export function effectiveStatus(p: Standing, now: Date = new Date()): MembershipStatus {
  return isLapsed(p, now) ? 'EXPIRED' : p.status;
}
