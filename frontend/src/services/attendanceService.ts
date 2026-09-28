import { api } from './api';
import type {
  MemberAttendanceHistory,
  AttendanceOversightEntry,
  AttendanceStats,
} from '@/types/event.types';

// Self-scoped — backend resolves the member from the JWT, never from a param.
export async function getMyAttendance(): Promise<MemberAttendanceHistory> {
  const { data } = await api.get<{ success: boolean; data: MemberAttendanceHistory }>(
    '/members/me/attendance',
  );
  return data.data;
}

// Auditor oversight (Article VI read-only scope) + Super Admin.
export async function listAttendance(params?: {
  eventId?: string;
  result?: string;
  search?: string;
  limit?: number;
}): Promise<AttendanceOversightEntry[]> {
  const { data } = await api.get<{ success: boolean; data: AttendanceOversightEntry[] }>(
    '/attendance',
    { params },
  );
  return data.data;
}

export async function getAttendanceStats(): Promise<AttendanceStats> {
  const { data } = await api.get<{ success: boolean; data: AttendanceStats }>('/attendance/stats');
  return data.data;
}
