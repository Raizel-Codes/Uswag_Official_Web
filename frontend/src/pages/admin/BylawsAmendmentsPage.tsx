// Constitution & By-Laws — SUPER ADMIN ONLY: log proposed amendments and record the outcome of
// the vote (Article IX). Guarded by RoleRoute allow={['super_admin']} and, on the server,
// requireRole('SUPER_ADMIN') in bylaws.routes.ts. Approved amendments appear on the public
// /bylaws page's amendments log.

import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePortalToast } from '@/hooks/usePortalToast';
import { listAmendments, proposeAmendment, resolveAmendment, type AmendmentLog } from '@/services/adminService';
import PageHeader from '@/components/portal/PageHeader';
import Panel from '@/components/portal/Panel';
import PortalToast from '@/components/portal/PortalToast';
import { apiError, formatDate } from '@/components/admin/format';

const STATUS: Record<AmendmentLog['status'], { cls: string; label: string }> = {
  proposed: { cls: 'mp-standing--pending', label: 'Awaiting vote' },
  approved: { cls: 'mp-standing--active', label: 'Approved' },
  rejected: { cls: 'mp-standing--rejected', label: 'Rejected' },
};

function ProposeForm({ onDone }: { onDone: (msg: string) => void }) {
  const [articleRef, setArticleRef] = useState('');
  const [proposal, setProposal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => proposeAmendment({ articleRef: articleRef.trim(), proposal: proposal.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['amendments'] });
      setArticleRef('');
      setProposal('');
      onDone('Amendment logged · awaiting the vote');
    },
    onError: (err) => setError(apiError(err, 'Could not log the amendment. Please try again.')),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!articleRef.trim()) return setError('Which article and section does it change?');
    if (!proposal.trim()) return setError('Describe the proposed change.');
    mutation.mutate();
  }

  return (
    <Panel title="Log a proposed amendment" id="propose">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="am-ref" className="ap-label">Article reference</label>
          <input id="am-ref" value={articleRef} onChange={(e) => setArticleRef(e.target.value)} placeholder="e.g. Article VI, Section 1" className="ap-input" />
        </div>
        <div>
          <label htmlFor="am-text" className="ap-label">Proposed change</label>
          <textarea id="am-text" rows={4} value={proposal} onChange={(e) => setProposal(e.target.value)} placeholder="What should the section say, and why?" className="ap-input" />
        </div>
        {error && <p role="alert" className="mp-alert">{error}</p>}
        <button type="submit" disabled={mutation.isPending} className="mp-btn mp-btn--primary w-full sm:w-auto">
          {mutation.isPending ? 'Saving…' : 'Log amendment'}
        </button>
        <p className="mp-muted text-[0.8125rem]">Article IX · an amendment takes effect only after it passes the vote the Constitution requires.</p>
      </form>
    </Panel>
  );
}

export default function BylawsAmendmentsPage() {
  const { toast, show } = usePortalToast();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery<AmendmentLog[]>({ queryKey: ['amendments'], queryFn: listAmendments, staleTime: 60_000 });
  const resolve = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => resolveAmendment(id, status),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ['amendments'] });
      show(v.status === 'approved' ? 'Recorded as approved' : 'Recorded as rejected');
    },
    onError: (err) => show(apiError(err, 'Could not record the outcome.'), 'error'),
  });

  const amendments = data ?? [];
  const pending = amendments.filter((a) => a.status === 'proposed');
  const resolved = amendments.filter((a) => a.status !== 'proposed');

  return (
    <div className="mp-page space-y-8">
      <PageHeader
        eyebrow="Governance · Bylaws"
        title="Constitution & By-Laws"
        lead="Log proposed amendments and record the outcome of each vote (Article IX)."
        actions={<span className="mp-standing mp-standing--neutral">Super Admin only</span>}
      />

      {error && <p role="alert" className="mp-alert">{apiError(error, 'We couldn’t load the amendments.')}</p>}

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <Panel title="The Constitution">
          <div className="flex items-center gap-4">
            <span className="mp-seal w-12 h-12 shrink-0" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 13h6M9 17h6" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">USWAG Constitution &amp; By-Laws (PDF)</p>
              <p className="mp-muted text-[0.875rem]">Public on the site’s Constitution page</p>
            </div>
            <a href="/constitution.pdf" download="USWAG-Constitution-and-By-Laws.pdf" className="mp-btn mp-btn--ghost mp-btn--sm shrink-0">
              Download
            </a>
          </div>
          <dl className="mt-5 pt-5 border-t border-[rgb(20_39_24/0.1)] grid grid-cols-2 gap-3">
            <div>
              <dt className="mp-eyebrow" style={{ fontSize: '0.6875rem' }}>Awaiting vote</dt>
              <dd className="mp-stat mt-1" style={{ color: pending.length ? 'var(--mp-warn-ink)' : undefined }}>{isLoading ? '…' : pending.length}</dd>
            </div>
            <div>
              <dt className="mp-eyebrow" style={{ fontSize: '0.6875rem' }}>Logged in total</dt>
              <dd className="mp-stat mt-1">{isLoading ? '…' : amendments.length}</dd>
            </div>
          </dl>
          <a href="/bylaws" className="mp-link inline-block mt-4 text-[0.875rem]">Open the public Constitution page</a>
        </Panel>

        <ProposeForm onDone={(m) => show(m)} />
      </div>

      <Panel title="Amendment log" aside={!isLoading && <span className="mp-muted">{pending.length} pending · {resolved.length} resolved</span>} flush>
        {isLoading ? (
          <div className="p-5 space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-16" />)}</div>
        ) : amendments.length === 0 ? (
          <p className="p-10 mp-muted text-center">No amendments on record.</p>
        ) : (
          <ul className="ap-list">
            {[...pending, ...resolved].map((a) => (
              <li key={a.id} className="ap-row items-start flex-col sm:flex-row">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{a.articleRef}</span>
                    <span className={`mp-standing ${STATUS[a.status].cls}`}>{STATUS[a.status].label}</span>
                  </div>
                  <p className="text-[0.9375rem] mt-1.5">{a.proposal}</p>
                  <p className="mp-muted text-[0.8125rem] mt-1">
                    Logged {formatDate(a.createdAt)}
                    {a.resolvedAt && ` · decided ${formatDate(a.resolvedAt)}`}
                  </p>
                </div>
                {a.status === 'proposed' && (
                  <div className="flex gap-2 shrink-0">
                    <button type="button" disabled={resolve.isPending} onClick={() => resolve.mutate({ id: a.id, status: 'approved' })} className="mp-btn mp-btn--primary mp-btn--sm">
                      Passed<span className="mp-sr-only">: {a.articleRef}</span>
                    </button>
                    <button type="button" disabled={resolve.isPending} onClick={() => resolve.mutate({ id: a.id, status: 'rejected' })} className="mp-btn mp-btn--ghost mp-btn--sm">
                      Didn’t pass<span className="mp-sr-only">: {a.articleRef}</span>
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <PortalToast toast={toast} />
    </div>
  );
}
