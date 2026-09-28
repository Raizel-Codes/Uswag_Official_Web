import { api } from './api';
import type { MemberProfile } from '@/types/member.types';

// Public — no auth. Creates the account up front in PENDING status; the
// applicant can log in immediately afterward to check their status (see
// ApplicationPage.tsx), but full member access waits on Secretary approval.
export async function submitApplication(payload: {
  name: string;
  email: string;
  password: string;
  collegeOrDept: string;
  yearLevel?: string;
  /** Honeypot — always empty for real users. See ApplicationPage.tsx. */
  website?: string;
}): Promise<{ id: string; email: string; status: string }> {
  const { data } = await api.post<{ success: boolean; data: { id: string; email: string; status: string } }>(
    '/members/apply',
    payload,
  );
  return data.data;
}

export async function getMyProfile(): Promise<MemberProfile> {
  const { data } = await api.get<{ success: boolean; data: MemberProfile }>('/members/me');
  return data.data;
}

export async function listMembers(params?: { status?: string; search?: string }) {
  const { data } = await api.get<{ success: boolean; data: MemberProfile[] }>('/members', { params });
  return data.data;
}

export async function approveApplication(memberId: string) {
  const { data } = await api.post<{ success: boolean; data: any }>(`/members/${memberId}/approve`);
  return data.data;
}

export async function rejectApplication(memberId: string, reason?: string) {
  const { data } = await api.post<{ success: boolean; data: any }>(`/members/${memberId}/reject`, { reason });
  return data.data;
}
