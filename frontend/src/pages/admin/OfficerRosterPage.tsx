// Officers — SUPER ADMIN ONLY: the current term, installing a newly elected batch, and one-off
// position changes (Article VI §4). Guarded by RoleRoute allow={['super_admin']} in AppRoutes and
// requireRole('SUPER_ADMIN') in officer.routes.ts (the real boundary). Only active members can be
// put in office; every change is audit-logged.

import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePortalToast } from '@/hooks/usePortalToast';
import { listOfficers, listOfficerNominees, assignOfficer, type OfficerUser } from '@/services/adminService';
import OfficerAvatar from '@/components/common/OfficerAvatar';
import InstallTermPanel from '@/components/admin/InstallTermPanel';
import PageHeader from '@/components/portal/PageHeader';
import Panel from '@/components/portal/Panel';
import PortalToast from '@/components/portal/PortalToast';
import { apiError, currentAcademicYear, formatDate } from '@/components/admin/format';

const POSITIONS = ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'AUDITOR', 'BUSINESS_MANAGER', 'PRO'] as const;
const LABEL: Record<string, string> = {
  PRESIDENT: 'President',
  VICE_PRESIDENT: 'Vice President',
  SECRETARY: 'Secretary',
  TREASURER: 'Treasurer',
  AUDITOR: 'Auditor',
  BUSINESS_MANAGER: 'Business Manager',
  PRO: 'Public Relations Officer',
};
const order = (p: string | null) => {
  const i = POSITIONS.indexOf((p ?? '') as (typeof POSITIONS)[number]);
  return i === -1 ? 99 : i;
};

function AssignPanel({ onDone }: { onDone: (msg: string) => void }) {
  const [userId, setUserId] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  // Active members only — the same list the term form uses; the server re-checks it.
  const { data: nominees = [] } = useQuery({ queryKey: ['officer-nominees'], queryFn: listOfficerNominees });
  const mutation = useMutation({
    mutationFn: () => assignOfficer({ userId, officerPosition: position }),
    onSuccess: (o) => {
      queryClient.invalidateQueries({ queryKey: ['officers'] });
      queryClient.invalidateQueries({ queryKey: ['officer-nominees'] });
      setUserId('');
      setPosition('');
      onDone(`${o.name} is now ${LABEL[o.officerPosition ?? ''] ?? 'an officer'}`);
    },
    onError: (err) => setError(apiError(err, 'Could not change the position. Please try again.')),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId) return setError('Choose the member to put in this position.');
    if (!position) return setError('Choose a position.');
    mutation.mutate();
  }

  return (
    <Panel title="Change one position mid-term" id="assign">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="assign-user" className="ap-label">Active member</label>
          <select id="assign-user" value={userId} onChange={(e) => setUserId(e.target.value)} className="ap-input">
            <option value="">Choose a member…</option>
            {nominees.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name} · {n.officerPosition ? LABEL[n.officerPosition] ?? n.officerPosition : n.collegeOrDept}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="assign-position" className="ap-label">New position</label>
          <select id="assign-position" value={position} onChange={(e) => setPosition(e.target.value)} className="ap-input">
            <option value="">Choose a position…</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>{LABEL[p]}</option>
            ))}
          </select>
          <p className="ap-hint">
            For a resignation or a swap between sitting officers. The person must still be an active member. The President gets the Super Admin console; every other
            position gets the Officer console for its own scope.
          </p>
        </div>
        {error && <p role="alert" className="mp-alert">{error}</p>}
        <button type="submit" disabled={mutation.isPending} className="mp-btn mp-btn--primary w-full sm:w-auto">
          {mutation.isPending ? 'Saving…' : 'Change position'}
        </button>
        <p className="mp-muted text-[0.8125rem]">Article VI §4 · every change is recorded in the audit log.</p>
      </form>
    </Panel>
  );
}

function OfficerDetailDialog({ officer, onClose }: { officer: OfficerUser; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="ap-dialog-backdrop" onClick={onClose}>
      <div
        className="ap-dialog mp-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="officer-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <OfficerAvatar seed={officer.id} className="mp-cameo w-14 h-14" />
            <div>
              <p id="officer-detail-title" className="mp-h3">{officer.name}</p>
              <p className="mp-muted text-[0.8125rem]">{officer.email}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="mp-btn mp-btn--ghost px-2 py-2">✕</button>
        </div>
        <dl className="mt-6 space-y-4">
          <div>
            <dt className="mp-eyebrow" style={{ fontSize: '0.6875rem' }}>Position</dt>
            <dd className="mt-1"><span className="mp-standing mp-standing--info">{LABEL[officer.officerPosition ?? ''] ?? '—'}</span></dd>
          </div>
          <div>
            <dt className="mp-eyebrow" style={{ fontSize: '0.6875rem' }}>College / Dept.</dt>
            <dd className="mt-1">{officer.collegeOrDept}</dd>
          </div>
          <div>
            <dt className="mp-eyebrow" style={{ fontSize: '0.6875rem' }}>Account since</dt>
            <dd className="mt-1">{formatDate(officer.createdAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export default function OfficerRosterPage() {
  const { toast, show } = usePortalToast();
  const { data, isLoading, error } = useQuery<OfficerUser[]>({ queryKey: ['officers'], queryFn: listOfficers, staleTime: 60_000 });
  const officers = [...(data ?? [])].sort((a, b) => order(a.officerPosition) - order(b.officerPosition));
  const [selected, setSelected] = useState<OfficerUser | null>(null);

  return (
    <div className="mp-page space-y-8">
      <PageHeader
        eyebrow="Governance · Officers"
        title="Officers"
        lead={`A.Y. ${currentAcademicYear()} term · positions per Article VI of the Constitution.`}
        actions={<span className="mp-standing mp-standing--neutral">Super Admin only</span>}
      />

      {error && <p role="alert" className="mp-alert">{apiError(error, 'We couldn’t load the officers.')}</p>}

      <section aria-labelledby="or-current">
        <div className="flex items-center gap-4">
          <h2 id="or-current" className="mp-h2 flex-1">Current term</h2>
          <span className="mp-muted text-[0.875rem]">{isLoading ? '…' : `${officers.length} officers`}</span>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="mp-skeleton h-44" />)}</div>
        ) : officers.length === 0 ? (
          <p className="mp-card p-8 mt-4 mp-muted text-center">No officers assigned for this term yet.</p>
        ) : (
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
            {officers.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setSelected(o)}
                  className="mp-card p-5 text-center w-full hover:shadow-md transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <OfficerAvatar seed={o.id} className="mp-cameo w-16 h-16 mx-auto" />
                  <p className="mp-h3 mt-3">{o.name}</p>
                  <p className="mp-eyebrow mt-1" style={{ fontSize: '0.6875rem' }}>{LABEL[o.officerPosition ?? ''] ?? '—'}</p>
                  <p className="mp-muted text-[0.8125rem] mt-2 leading-snug">{o.collegeOrDept}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 min-w-0">
          <InstallTermPanel officers={officers} onDone={(m) => show(m)} />
        </div>
        <div className="space-y-6 min-w-0">
          <AssignPanel onDone={(m) => show(m)} />
          <Panel title="Past terms">
            <p className="text-[0.9375rem]">There’s no browsable archive of past terms yet.</p>
            <p className="mp-muted text-[0.875rem] mt-2">
              Every installed term is written to the Audit Log with who came in and who stepped down. Until an archive page exists, keep the handover
              record with the adviser. The public site’s founding-batch roster is separate.
            </p>
          </Panel>
        </div>
      </div>

      {selected && <OfficerDetailDialog officer={selected} onClose={() => setSelected(null)} />}

      <PortalToast toast={toast} />
    </div>
  );
}
