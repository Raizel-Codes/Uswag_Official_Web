import { api } from './api';

// ---------------------------------------------------------------------------
// Officers — SUPER ADMIN ONLY
// Backend: officer.routes.ts requireRole('SUPER_ADMIN')
// ---------------------------------------------------------------------------

export interface OfficerUser {
  id: string;
  name: string;
  email: string;
  role: string;
  officerPosition: string | null;
  collegeOrDept: string;
  createdAt: string;
  /** Created by the Super Admin and not yet signed in: still needs a setup link. */
  awaitingPasswordSetup: boolean;
}

export async function listOfficers(): Promise<OfficerUser[]> {
  const { data } = await api.get<{ success: boolean; data: OfficerUser[] }>('/officers');
  return data.data;
}

export async function assignOfficer(payload: {
  userId: string;
  officerPosition: string;
}): Promise<OfficerUser> {
  const { data } = await api.post<{ success: boolean; data: OfficerUser }>(
    '/officers/assign',
    payload,
  );
  return data.data;
}

// An active member who may be put in office. Officers are never created from scratch: the
// server only accepts members who have already applied, paid and been approved (Article III).
export interface OfficerNominee {
  id: string;
  name: string;
  email: string;
  collegeOrDept: string;
  yearLevel: string | null;
  officerPosition: string | null;
}

export async function listOfficerNominees(): Promise<OfficerNominee[]> {
  const { data } = await api.get<{ success: boolean; data: OfficerNominee[] }>('/officers/nominees');
  return data.data;
}

type SeatedOfficer = { userId: string; name: string; officerPosition: string };

export interface InstallTermResult {
  /** Everyone in office after the save. */
  installed: SeatedOfficer[];
  /** Newly seated by this save (a vacant seat filled, or a move). */
  added: SeatedOfficer[];
  /** Kept the seat they already held. */
  continuing: SeatedOfficer[];
  steppedDown: { userId: string; name: string; previous: string | null }[];
}

/** `term` = a new election (installs the whole batch); `update` = a mid-term save of the current term. */
export async function installOfficerTerm(
  assignments: { userId: string; officerPosition: string }[],
  mode: 'term' | 'update' = 'term',
): Promise<InstallTermResult> {
  const { data } = await api.post<{ success: boolean; data: InstallTermResult }>('/officers/term', { assignments, mode });
  return data.data;
}

// ---------------------------------------------------------------------------
// Bylaws — SUPER ADMIN ONLY (GET is public but we consume it here too)
// Backend: bylaws.routes.ts
// ---------------------------------------------------------------------------

export interface AmendmentLog {
  id: string;
  articleRef: string;
  proposal: string;
  proposedBy: string;
  status: 'proposed' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt: string | null;
}

export async function listAmendments(): Promise<AmendmentLog[]> {
  const { data } = await api.get<{ success: boolean; data: AmendmentLog[] }>('/bylaws/amendments');
  return data.data;
}

export async function proposeAmendment(payload: {
  articleRef: string;
  proposal: string;
}): Promise<AmendmentLog> {
  const { data } = await api.post<{ success: boolean; data: AmendmentLog }>(
    '/bylaws/amendments',
    payload,
  );
  return data.data;
}

export async function resolveAmendment(
  id: string,
  status: 'approved' | 'rejected',
): Promise<AmendmentLog> {
  const { data } = await api.patch<{ success: boolean; data: AmendmentLog }>(
    `/bylaws/amendments/${id}/resolve`,
    { status },
  );
  return data.data;
}


// ---------------------------------------------------------------------------
// Audit Log — SUPER ADMIN ONLY
// Backend: audit.routes.ts requireRole('SUPER_ADMIN')
// ---------------------------------------------------------------------------

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actor?: { id: string; name: string };
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export async function listAuditLog(): Promise<AuditLogEntry[]> {
  const { data } = await api.get<{ success: boolean; data: AuditLogEntry[] }>('/audit-log');
  return data.data;
}


// ---------------------------------------------------------------------------
// Accounts — SUPER ADMIN ONLY
// Backend: account.routes.ts requireRole('SUPER_ADMIN')
// ---------------------------------------------------------------------------

/** What deleting an account removes. `records` = officer activity the database won't orphan (see account.service.ts). */
export interface AccountImpact {
  scans: number;
  auditEntries: number;
  financeEntries: number;
  purchaseRequests: number;
  posts: number;
  rsvps: number;
  records: number;
}

export interface AccountPreview {
  account: { id: string; name: string; email: string; role: string; officerPosition: string | null; collegeOrDept: string };
  impact: AccountImpact;
}

export async function previewAccountDeletion(userId: string): Promise<AccountPreview> {
  const { data } = await api.get<{ success: boolean; data: AccountPreview }>(`/accounts/${userId}/impact`);
  return data.data;
}

export async function deleteAccount(userId: string, purgeRecords: boolean): Promise<{ id: string; name: string }> {
  const { data } = await api.delete<{ success: boolean; data: { id: string; name: string } }>(`/accounts/${userId}`, { data: { purgeRecords } });
  return data.data;
}

// ---------------------------------------------------------------------------
// Accounts — SUPER ADMIN ONLY (backend: account.routes.ts)
// ---------------------------------------------------------------------------

export interface NewAccountInput {
  name: string;
  email: string;
  studentId: string;
  collegeOrDept: string;
  yearLevel?: string;
}

export interface SetupLink {
  url: string;
  expiresInMinutes: number;
}

/** An active member without the public application (e.g. an incoming officer); returns their one-time setup link. */
export async function createAccount(payload: NewAccountInput): Promise<SetupLink & { id: string; name: string; email: string }> {
  const { data } = await api.post<{ success: boolean; data: SetupLink & { id: string; name: string; email: string } }>('/accounts', payload);
  return data.data;
}

export async function issueSetupLink(userId: string): Promise<SetupLink> {
  const { data } = await api.post<{ success: boolean; data: SetupLink }>(`/accounts/${userId}/setup-link`);
  return data.data;
}
