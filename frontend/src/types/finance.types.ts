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
  memberName: string;
  memberId?: string;
  amount: number;
  note?: string;
}

export interface RecordExpensePayload {
  description: string;
  amount: number;
}
