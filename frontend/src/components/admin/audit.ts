import type { AuditLogEntry } from '@/services/adminService';

// Human wording for audit-log actions (logAction() calls in the backend controllers).
// Prefix-matched, most specific first.
const ACTIONS: { prefix: string; label: string; sentence: string; tone: 'active' | 'rejected' | 'pending' | 'info' | 'neutral' }[] = [
  { prefix: 'member.approve', label: 'Member approved', sentence: 'approved a membership application', tone: 'active' },
  { prefix: 'member.reject', label: 'Member rejected', sentence: 'rejected a membership application', tone: 'rejected' },
  { prefix: 'member.studentId.view', label: 'Student ID viewed', sentence: 'viewed an applicant’s student ID', tone: 'neutral' },
  { prefix: 'member.setupLink', label: 'Setup link created', sentence: 'created a password setup link', tone: 'pending' },
  { prefix: 'maintenance.on', label: 'Maintenance on', sentence: 'put the site under maintenance', tone: 'pending' },
  { prefix: 'maintenance.extend', label: 'Maintenance extended', sentence: 'extended the maintenance window', tone: 'pending' },
  { prefix: 'maintenance.off', label: 'Maintenance off', sentence: 'reopened the site after maintenance', tone: 'active' },
  { prefix: 'account.create', label: 'Account created', sentence: 'created an account without an application', tone: 'info' },
  { prefix: 'account.setupLink', label: 'Setup link created', sentence: 'created a password setup link', tone: 'pending' },
  { prefix: 'account.studentId.change', label: 'Student ID changed', sentence: 'corrected their own student ID', tone: 'neutral' },
  { prefix: 'account.delete', label: 'Account deleted', sentence: 'deleted an account', tone: 'rejected' },
  { prefix: 'officer.assign', label: 'Officer assigned', sentence: 'reassigned an officer position', tone: 'info' },
  { prefix: 'scan.officer_verify', label: 'Officer ID checked', sentence: 'checked an officer’s ID at a scan', tone: 'neutral' },
  { prefix: 'finance.dues', label: 'Dues recorded', sentence: 'recorded a dues payment', tone: 'info' },
  { prefix: 'finance.expense', label: 'Expense logged', sentence: 'logged an expense', tone: 'neutral' },
  { prefix: 'bylaws.propose_amendment', label: 'Amendment proposed', sentence: 'proposed a bylaws amendment', tone: 'pending' },
  { prefix: 'bylaws.approved', label: 'Amendment approved', sentence: 'approved a bylaws amendment', tone: 'active' },
  { prefix: 'bylaws.rejected', label: 'Amendment rejected', sentence: 'rejected a bylaws amendment', tone: 'rejected' },
  { prefix: 'bylaws', label: 'Bylaws updated', sentence: 'updated a bylaws amendment', tone: 'info' },
  { prefix: 'event.create_draft', label: 'Draft saved', sentence: 'saved an event as a draft', tone: 'neutral' },
  { prefix: 'event.create', label: 'Event created', sentence: 'created an event', tone: 'info' },
  { prefix: 'event.publish', label: 'Event published', sentence: 'published a drafted event', tone: 'info' },
];

function match(action: string) {
  return ACTIONS.find((a) => action.startsWith(a.prefix));
}

export function auditLabel(action: string) {
  return match(action)?.label ?? action.replace(/\./g, ' · ');
}

export function auditTone(action: string) {
  return match(action)?.tone ?? 'neutral';
}

export function auditSentence(entry: AuditLogEntry) {
  const who = entry.actor?.name ?? 'Someone';
  return `${who} ${match(entry.action)?.sentence ?? `performed ${entry.action}`}`;
}
