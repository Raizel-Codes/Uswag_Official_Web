import { api } from './api';
import type {
  FinanceEntry,
  FeeRoster,
  FinanceSummary,
  RecordDuesPayload,
  RecordExpensePayload,
} from '@/types/finance.types';

// GET /finance/summary — Treasurer + Auditor + Super Admin
export async function getFinanceSummary(): Promise<FinanceSummary> {
  const { data } = await api.get<{ success: boolean; data: FinanceSummary }>('/finance/summary');
  return data.data;
}

// GET /finance/entries?type=DUES|EXPENSE&limit=N — Treasurer + Auditor + Super Admin
export async function listFinanceEntries(params?: {
  type?: 'DUES' | 'EXPENSE';
  limit?: number;
}): Promise<FinanceEntry[]> {
  const { data } = await api.get<{ success: boolean; data: FinanceEntry[] }>('/finance/entries', {
    params,
  });
  return data.data;
}

// POST /finance/dues — Treasurer + Super Admin only (Auditor gets 403 → ForbiddenError)
export async function recordDues(payload: RecordDuesPayload): Promise<FinanceEntry> {
  const { data } = await api.post<{ success: boolean; data: FinanceEntry }>(
    '/finance/dues',
    payload,
  );
  return data.data;
}

// POST /finance/expense — Treasurer + Super Admin only
export async function recordExpense(payload: RecordExpensePayload): Promise<FinanceEntry> {
  const { data } = await api.post<{ success: boolean; data: FinanceEntry }>(
    '/finance/expense',
    payload,
  );
  return data.data;
}

// GET /finance/roster — Treasurer + Auditor (read-only) + Super Admin: everyone with their fee standing
export async function getFeeRoster(): Promise<FeeRoster> {
  const { data } = await api.get<{ success: boolean; data: FeeRoster }>('/finance/roster');
  return data.data;
}

// POST /finance/roster/:memberId/extend — Treasurer + Super Admin: more time for an unpaid application
export async function extendApplication(memberId: string): Promise<{ removedOn: string }> {
  const { data } = await api.post<{ success: boolean; data: { removedOn: string } }>(`/finance/roster/${memberId}/extend`);
  return data.data;
}
