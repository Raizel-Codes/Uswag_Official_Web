import { z } from 'zod';

// NwSSU student ID: YY-NNNNN or YY-NNNNNN, hyphen optional when typed.
const STUDENT_ID_PATTERN = /^\d{2}-?\d{5,6}$/;

// Canonicalized to "YY-NNNNN" so both spellings are one student (see below).
export const studentIdField = z
  .string()
  .transform((s) => s.replace(/\s+/g, ''))
  .pipe(z.string().regex(STUDENT_ID_PATTERN, 'Enter your student ID like 23-00877 (year, hyphen, then 5 or 6 digits)'))
  .transform((s) => {
    const digits = s.replace('-', '');
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  })
  .refine((s) => Number(s.slice(0, 2)) <= new Date().getFullYear() % 100, 'That enrollment year hasn’t happened yet. Check the first two digits');

export const issueResetLinkSchema = z.object({
  // True when the officer confirmed the person another way (required if the student ID didn't match).
  identityConfirmed: z.boolean().optional().default(false),
});

// Public self-service membership application — POST /members/apply.
// Article III: any bona fide NwSSU undergraduate may apply; the account is
// created up front in PENDING status and only gains real member access
// (QR issuance, active status) once the Secretary approves it.
export const submitApplicationSchema = z
  .object({
    name: z.string().trim().min(2, 'Full name is required'),
    // Lowercased so "Juan@…" and "juan@…" can't become two accounts.
    email: z.string().trim().toLowerCase().email('A valid email is required'),
    // NwSSU format YY-NNNNN (or 6 digits): the enrollment year's last two
    // digits, then the student's number that year, e.g. 23-00877. Typed with
    // or without the hyphen; always canonicalized to "YY-NNNNN" before it is
    // hashed/encrypted (utils/crypto.ts), so both spellings are one student.
    studentId: studentIdField,
    // Required for your own application; omitted when a friend submits for
    // you (you set it later via the Secretary's setup link).
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    collegeOrDept: z.string().min(2, 'College/Department is required'),
    yearLevel: z.string().optional(),
    // Friend-assisted application: the applicant is present but using
    // someone else's device.
    onBehalf: z
      .object({
        helperName: z.string().trim().min(2, 'Tell us who is helping'),
        attested: z.literal(true, { errorMap: () => ({ message: 'Confirm your friend is with you and agreed to apply' }) }),
      })
      .optional(),
    // Honeypot — see ApplicationPage.tsx. A real applicant never sees or fills
    // this field; a script that blindly fills every input on the form does.
    // Accepted here (not rejected as an unknown field) so the controller can
    // silently no-op instead of returning a validation error that would tip
    // the script off that this field is being checked.
    website: z.string().optional(),
  })
  .refine((d) => d.onBehalf || d.password, { message: 'Password is required', path: ['password'] });

// academicYear is optional — the frontend's quick-approve action (dashboard,
// pending-list) doesn't collect it, so the controller defaults to the
// current academic year (member.service.ts getCurrentAcademicYear()) when
// omitted. Still overridable by any caller that does supply one.
// "2026-2027": two consecutive years. The expiry date is derived from it (utils/academicYear.ts).
const academicYear = z
  .string()
  .regex(/^\d{4}-\d{4}$/, 'Use the form 2026-2027')
  .refine((v) => Number(v.slice(5)) === Number(v.slice(0, 4)) + 1, 'The years must be consecutive, like 2026-2027');

export const approveApplicationSchema = z.object({
  academicYear: academicYear.optional(),
});

// Renew an expired membership; the year defaults to the current academic year.
export const renewMemberSchema = z.object({
  academicYear: academicYear.optional(),
});

// reason is optional for the same reason — most reject actions in the UI
// are a single click, not a form. It's passed through to the audit log
// metadata when present.
export const rejectApplicationSchema = z.object({
  reason: z.string().min(1).optional(),
});
