import { FOUNDED_YEAR } from './timeline.data';

export interface FoundingOfficer {
  position: string;
  /** null until confirmed with the USWAG adviser. */
  name: string | null;
  collegeOrDept?: string;
}

/**
 * ⚠️ PLACEHOLDER — the founding (first-batch) officers of USWAG, c. {FOUNDED_YEAR}.
 *
 * Names are pending confirmation with the adviser. Positions follow Article VI of the
 * *current* Constitution; if the founding batch used different titles, replace them here
 * too. Fill in `name` (and optionally `collegeOrDept`) — the Officers page shows a
 * "Pending confirmation" badge until every name is filled.
 */
// Only the founding year is confirmed — not which academic year (2009–10 or 2010–11) the first term spanned.
export const FOUNDING_TERM_LABEL = String(FOUNDED_YEAR);

export const FOUNDING_OFFICERS: FoundingOfficer[] = [
  { position: 'President', name: null },
  { position: 'Vice President', name: null },
  { position: 'Secretary', name: null },
  { position: 'Treasurer', name: null },
  { position: 'Auditor', name: null },
  { position: 'Business Manager', name: null },
  { position: 'Public Relations Officer', name: null },
];
