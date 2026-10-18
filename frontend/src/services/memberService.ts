import { api } from './api';
import type { ApplicationOnBehalf, MemberProfile, ResetRequest } from '@/types/member.types';

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

/** Secretary / Super Admin: renew an expired membership for the current academic year (Article III §3). */
export async function renewMember(memberId: string) {
  const { data } = await api.post<{ success: boolean; data: unknown }>(`/members/${memberId}/renew`);
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

/** Open "I can't sign in" requests this officer may act on (Secretary: members; Super Admin / VP: everyone else too). */
export async function listResetRequests(): Promise<ResetRequest[]> {
  const { data } = await api.get<{ success: boolean; data: ResetRequest[] }>('/members/reset-requests');
  return data.data;
}

/**
 * One-time, 1-hour password-reset link for an open request. `identityConfirmed` is required when the
 * student ID didn't match or couldn't be checked: the officer says they confirmed the person another way.
 */
export async function issueResetLink(userId: string, identityConfirmed: boolean): Promise<{ url: string; expiresInMinutes: number }> {
  const { data } = await api.post<{ success: boolean; data: { url: string; expiresInMinutes: number } }>(
    `/members/reset-requests/${userId}/link`,
    { identityConfirmed },
  );
  return data.data;
}

export async function dismissResetRequest(userId: string): Promise<void> {
  await api.post(`/members/reset-requests/${userId}/dismiss`);
}

/** Correct your own student ID; the password is asked again because the ID is what proves who you are. */
export async function changeStudentId(studentId: string, password: string): Promise<{ changed: boolean }> {
  const { data } = await api.post<{ success: boolean; data: { changed: boolean } }>('/members/me/student-id', { studentId, password });
  return data.data;
}
