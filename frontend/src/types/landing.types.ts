/** Static era surface a landing section falls back to when scroll-scrubbing is off (reduced motion). */
export type LandingEra = 'past' | 'mid' | 'present' | 'present-dark';

export interface TimelineEntry {
  id: string;
  /** Display label for the marker — a year ("2010") or a word ("Today"). */
  label: string;
  /** ISO year/date for <time dateTime>, when one is known. */
  dateTime?: string;
  title: string;
  body: string;
  /**
   * false = placeholder awaiting confirmation from the USWAG adviser. Rendered with a visible
   * "Pending confirmation" badge so no unverified history is ever presented as fact.
   */
  confirmed: boolean;
}
