import { api } from './api';
import type { ApplicationOnBehalf, MemberProfile } from '@/types/member.types';

// Public — no auth. Creates the account up front in PENDING status; the
// applicant can log in immediately afterward to check their status (see
// ApplicationPage.tsx), but full member access waits on Secretary approval.
// With `onBehalf` (a friend's device), no password is sent: the applicant
// sets one later through the Secretary's one-time setup link.
export async function submitApplication(payload: {
  name: string;
  email: string;
  studentId: string;
  password?: string;
  collegeOrDept: string;
  yearLevel?: string;
  onBehalf?: ApplicationOnBehalf;
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
  const { data } = await api.post<{ success: boolean; data: unknown }>(`/members/${memberId}/approve`);
  return data.data;
}

export async function rejectApplication(memberId: string, reason?: string) {
  const { data } = await api.post<{ success: boolean; data: unknown }>(`/members/${memberId}/reject`, { reason });
  return data.data;
}

/** Secretary only. Decrypts a pending applicant's student ID (each call is audit-logged). */
export async function revealStudentId(memberId: string): Promise<string> {
  const { data } = await api.get<{ success: boolean; data: { studentId: string } }>(`/members/${memberId}/student-id`);
  return data.data.studentId;
}

/** Secretary only. One-time, 1-hour password-setup link for a friend-assisted applicant. */
export async function createSetupLink(memberId: string): Promise<{ url: string; expiresInMinutes: number }> {
  const { data } = await api.post<{ success: boolean; data: { url: string; expiresInMinutes: number } }>(
    `/members/${memberId}/setup-link`,
  );
  return data.data;
}
