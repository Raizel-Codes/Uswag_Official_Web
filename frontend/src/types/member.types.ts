export type MembershipStatus = 'active' | 'pending' | 'expired' | 'rejected';

export interface MemberProfile {
  id: string;
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
  /** GET /members/me only: why the card / event sign-ups are locked (null when active). */
  standingNote?: string | null;
}

/** Friend-assisted application: the applicant is present, on someone else's device. */
export interface ApplicationOnBehalf {
  helperName: string;
  attested: true;
}
