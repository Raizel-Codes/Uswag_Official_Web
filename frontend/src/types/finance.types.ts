// Finance types — mirrors the FinanceEntry model in schema.prisma.
// Written by Treasurer, read by Treasurer + Auditor + Super Admin.

export type FinanceEntryType = 'DUES' | 'EXPENSE';

export interface FinanceEntry {
  id: string;
  type: FinanceEntryType;
  description: string;
  amount: number; // positive = income (dues), negative = expense
  relatedMemberId: string | null;
  recordedById: string;
  recordedBy: { id: string; name: string };
  createdAt: string; // ISO date
}

export interface FinanceSummary {
  fundsOnHand: number;
  totalDues: number;
  totalExpenses: number;
  activeMembers: number;
  pendingApplications: number;
}

export interface RecordDuesPayload {
  memberId: string; // MemberProfile.id, picked from the roster
  amount: number;
  note?: string;
}

export interface RecordExpensePayload {
  description: string;
  amount: number;
}

// --- Membership fee (backend services/fee.service.ts) ---

/** exempt: serving as an officer (no fee). partial: paid some, the rest due 3 months after the first payment. overdue: that time ran out. */
export type FeeState = 'exempt' | 'paid' | 'partial' | 'overdue' | 'unpaid';

export interface FeeStanding {
  state: FeeState;
  paid: number;
  due: number;
  /** partial / overdue: when the balance is (was) due, ISO. */
  deadline: string | null;
  /** An unpaid application: the day it is removed if nothing is recorded, ISO. */
  removedOn?: string | null;
}

export interface FeeRosterMember {
  id: string; // MemberProfile.id: what recordDues takes
  name: string;
  collegeOrDept: string;
  serialNumber: string;
  status: 'pending' | 'active' | 'expired';
  fee: FeeStanding;
  removedOn: string | null;
  isOfficer: boolean;
}

export interface FeeRules {
  amount: number;
  partialMonths: number;
  applicantDays: number;
  extensionDays: number;
}

export interface FeeRoster {
  rules: FeeRules;
  members: FeeRosterMember[];
}
