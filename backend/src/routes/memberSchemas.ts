import { z } from 'zod';

// Public self-service membership application — POST /members/apply.
// Article III: any bona fide NwSSU undergraduate may apply; the account is
// created up front in PENDING status and only gains real member access
// (QR issuance, active status) once the Secretary approves it.
export const submitApplicationSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  collegeOrDept: z.string().min(2, 'College/Department is required'),
  yearLevel: z.string().optional(),
  // Honeypot — see ApplicationPage.tsx. A real applicant never sees or fills
  // this field; a script that blindly fills every input on the form does.
  // Accepted here (not rejected as an unknown field) so the controller can
  // silently no-op instead of returning a validation error that would tip
  // the script off that this field is being checked.
  website: z.string().optional(),
});

// academicYear is optional — the frontend's quick-approve action (dashboard,
// pending-list) doesn't collect it, so the controller defaults to the
// current academic year (member.service.ts getCurrentAcademicYear()) when
// omitted. Still overridable by any caller that does supply one.
export const approveApplicationSchema = z.object({
  academicYear: z.string().min(1).optional(),
});

// reason is optional for the same reason — most reject actions in the UI
// are a single click, not a form. It's passed through to the audit log
// metadata when present.
export const rejectApplicationSchema = z.object({
  reason: z.string().min(1).optional(),
});
