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
export const FOUNDING_TERM_LABEL = `${FOUNDED_YEAR}–${FOUNDED_YEAR + 1}`;

export const FOUNDING_OFFICERS: FoundingOfficer[] = [
  { position: 'President', name: null },
  { position: 'Vice President', name: null },
  { position: 'Secretary', name: null },
  { position: 'Treasurer', name: null },
  { position: 'Auditor', name: null },
  { position: 'Business Manager', name: null },
  { position: 'Public Relations Officer', name: null },
];
