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
}
