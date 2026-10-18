import type { FeeStanding } from './finance.types';

export type MembershipStatus = 'active' | 'pending' | 'expired' | 'rejected';

export interface MemberProfile {
  id: string;
  userId: string; // the account behind this profile (Super Admin "Delete account")
  serialNumber: string; // e.g. UW-2026-004821
  name: string;
  email: string;
  collegeOrDept: string;
  yearLevel: string;
  status: MembershipStatus;
  academicYear: string; // e.g. "2026-2027"
  attendanceRate: number; // 0-100
  joinedAt: string; // ISO date
  // Application review aids (Secretary). The student ID itself is never in
  // this payload — fetch it with revealStudentId(), which is audit-logged.
  studentIdOnFile: boolean; // false once the application is approved/rejected
  submittedByProxy: boolean; // a friend submitted it from their device
  proxyName: string | null; // who helped; deleted once the application is decided
  awaitingPasswordSetup: boolean; // needs the Secretary's one-time setup link
  nameMatches: number; // other member accounts with the same name (pending only)
  /** Membership-fee standing: what the Secretary's approve / renew buttons check. */
  fee?: FeeStanding;
  /** GET /members/me only: why the card / event sign-ups are locked (null when active). */
  standingNote?: string | null;
}

/** A person asking an officer for help signing in (officer-assisted password reset). */
export interface ResetRequest {
  userId: string;
  name: string;
  email: string;
  collegeOrDept: string;
  yearLevel: string | null;
  /** An officer's account: only the Super Admin / VP can handle it. */
  isOfficer: boolean;
  requestedAt: string;
  /** Did the student ID they typed match the one on file? null = couldn't be checked (no ID on file). */
  studentIdMatched: boolean | null;
}

/** Friend-assisted application: the applicant is present, on someone else's device. */
export interface ApplicationOnBehalf {
  helperName: string;
  attested: true;
}
