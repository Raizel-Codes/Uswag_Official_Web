// Super Admin: permanently delete one account (a member or an officer). Shows what goes with it before
// anything happens; an account with officer records (scans, audit entries, finance entries, purchase
// requests) needs an extra tick to confirm those are deleted too. The server enforces every rule
// (not yourself, not the last Super Admin, only the President removes a Super Admin) — see
// account.service.ts. Used from the Members board and the Officers roster.

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteAccount, previewAccountDeletion } from '@/services/adminService';
import { apiError } from '@/components/admin/format';

interface Props {
  userId: string;
  onClose: () => void;
  /** Called after the account is gone, with the person's name. */
  onDeleted: (name: string) => void;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export default function DeleteAccountDialog({ userId, onClose, onDeleted }: Props) {
  const queryClient = useQueryClient();
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useQuery({ queryKey: ['account-impact', userId], queryFn: () => previewAccountDeletion(userId), retry: false, gcTime: 0 });
  const remove = useMutation({
    mutationFn: () => deleteAccount(userId, confirmed),
    onSuccess: (done) => {
      for (const key of ['members', 'officers', 'officer-nominees', 'audit-log', 'reset-requests']) queryClient.invalidateQueries({ queryKey: [key] });
      onDeleted(done.name);
    },
    onError: (err) => setError(apiError(err, 'Could not delete this account. Please try again.')),
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !remove.isPending && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, remove.isPending]);

  const data = preview.data;
  const impact = data?.impact;
  const needsConfirm = (impact?.records ?? 0) > 0;
  const isOfficer = data ? data.account.role !== 'MEMBER' : false;
  const ready = !!data && (!needsConfirm || confirmed);

  const lines: string[] = [];
  if (impact) {
    if (impact.scans) lines.push(plural(impact.scans, 'scan'));
    if (impact.auditEntries) lines.push(plural(impact.auditEntries, 'audit log entry', 'audit log entries'));
    if (impact.financeEntries) lines.push(plural(impact.financeEntries, 'finance entry', 'finance entries'));
    if (impact.purchaseRequests) lines.push(plural(impact.purchaseRequests, 'purchase request'));
  }

  return (
    <div className="ap-dialog-backdrop" onClick={() => !remove.isPending && onClose()}>
      <div className="ap-dialog mp-card" role="alertdialog" aria-modal="true" aria-labelledby="del-acct-title" aria-describedby="del-acct-body" onClick={(e) => e.stopPropagation()}>
        <p id="del-acct-title" className="mp-h3">Delete this account?</p>

        {preview.isLoading && <div className="mp-skeleton h-24 mt-4" aria-busy="true" />}
        {preview.error && <p role="alert" className="mp-alert mt-4">{apiError(preview.error, 'We couldn’t check this account.')}</p>}

        {data && impact && (
          <div id="del-acct-body" className="mt-3 space-y-4 text-[0.9375rem]">
            <div>
              <p className="font-semibold">{data.account.name}</p>
              <p className="mp-muted text-[0.8125rem]">{data.account.email}</p>
              {isOfficer && <p className="mp-muted text-[0.8125rem]">Officer account{data.account.officerPosition ? ` · ${data.account.officerPosition.replace(/_/g, ' ').toLowerCase()}` : ''}</p>}
            </div>

            <p>
              This permanently removes the account and everything tied to the person’s membership: their profile and card
              {impact.rsvps > 0 ? `, ${plural(impact.rsvps, 'event sign-up')},` : ''} and notifications. They’ll be signed out, and the student ID can be used to apply
              again. It can’t be undone.
            </p>

            {needsConfirm && (
              <div className="mp-alert" role="note">
                <p className="font-semibold">This account has officer records</p>
                <p className="mt-1">Deleting it also deletes: {lines.join(', ')}.{impact.financeEntries > 0 && ' Finance entries change the financial statements.'}</p>
                <label className="flex items-start gap-3 mt-3 cursor-pointer">
                  <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
                  <span>I understand these records will be permanently deleted. This is meant for test accounts.</span>
                </label>
              </div>
            )}
            {impact.posts > 0 && <p className="mp-muted text-[0.8125rem]">{plural(impact.posts, 'post')} they wrote will stay, with no author.</p>}
            <p className="mp-muted text-[0.8125rem]">The deletion itself is recorded in the audit log.</p>
          </div>
        )}

        {error && <p role="alert" className="mp-alert mt-4">{error}</p>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-6">
          <button type="button" onClick={onClose} disabled={remove.isPending} className="mp-btn mp-btn--ghost w-full sm:w-auto">Cancel</button>
          <button type="button" disabled={!ready || remove.isPending} onClick={() => { setError(null); remove.mutate(); }} className="mp-btn mp-btn--danger w-full sm:w-auto">
            {remove.isPending ? 'Deleting…' : 'Delete account'}
          </button>
        </div>
      </div>
    </div>
  );
}
