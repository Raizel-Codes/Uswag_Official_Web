// The membership fee rules, in one place. Article III: a member pays "the membership fee set by the
// officers and approved by the adviser" (currently ₱50.00, yearly with the renewal). The two time
// limits below are USWAG policy, not Constitution text; change them here and everything follows
// (the Treasurer's list, the Secretary's approval check, the daily cleanup, the wording shown to people).

/** Pesos. */
export const MEMBERSHIP_FEE = 50;

/** A first payment of less than the full fee opens this many months to pay the rest. After that the membership returns to PENDING. */
export const PARTIAL_PAYMENT_MONTHS = 3;

/** An application that nobody has paid for is removed after this many days (the person can apply again). */
export const APPLICANT_DAYS = 7;

/** The applicant is told this many days before the removal. */
export const APPLICANT_WARNING_DAYS = 2;

/** One click of the Treasurer's "give more time" button adds this many days. */
export const APPLICANT_EXTENSION_DAYS = 7;
