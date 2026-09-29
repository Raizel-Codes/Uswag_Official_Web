import { FOUNDED_YEAR } from './timeline.data';

export interface RosterOfficer {
  position: string;
  /** null until confirmed with the USWAG adviser. */
  name: string | null;
  collegeOrDept?: string;
  /** Rows sharing a group render under one sub-heading on the sheet. */
  group?: string;
}

/** A printed batch roster: the term it covers, who held each post, and how its stamp reads. */
export interface RosterBatch {
  termLabel: string;
  officers: RosterOfficer[];
  stamp: { center: string; sub: string };
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
export const FIRST_BATCH: RosterBatch = {
  termLabel: String(FOUNDED_YEAR),
  stamp: { center: 'FIRST', sub: `BATCH ${FOUNDED_YEAR}` },
  officers: [
    { position: 'President', name: null },
    { position: 'Vice President', name: null },
    { position: 'Secretary', name: null },
    { position: 'Treasurer', name: null },
    { position: 'Auditor', name: null },
    { position: 'Business Manager', name: null },
    { position: 'Public Relations Officer', name: null },
  ],
};

export const SECOND_BATCH_YEAR = 2025;

const PRO_GROUP = 'Public Relations Officers · College Commissioners';

/**
 * The second batch, {SECOND_BATCH_YEAR}, as supplied by the organisation (2026-09-29).
 *
 * The college commissioners are the PROs of their colleges (codes match the application
 * form's list). In 2025 only three colleges — CCIS, CCJS and COM — had a commissioner; the
 * other colleges had none, so they are deliberately absent rather than listed as pending.
 * Only the year is confirmed, not which academic year the term spanned.
 */
export const SECOND_BATCH: RosterBatch = {
  termLabel: String(SECOND_BATCH_YEAR),
  stamp: { center: 'SECOND', sub: `BATCH ${SECOND_BATCH_YEAR}` },
  officers: [
    { position: 'President', name: 'Ella Denise Pornias' },
    { position: 'Vice President', name: 'Peter Agura Jr.' },
    { position: 'Secretary', name: 'Micah Monera' },
    { position: 'Treasurer', name: 'Francis Erika Salem' },
    { position: 'Auditor', name: 'Cherlyn Caliste' },
    { position: 'Business Manager', name: 'John Philip Arana' },
    { position: 'CCIS Commissioner', name: 'Adrian Garcia', collegeOrDept: 'PRO', group: PRO_GROUP },
    { position: 'CCJS Commissioner', name: 'Jamaica Novicio', collegeOrDept: 'PRO', group: PRO_GROUP },
    { position: 'COM Commissioner', name: 'Arman Hiliran', collegeOrDept: 'PRO', group: PRO_GROUP },
  ],
};
