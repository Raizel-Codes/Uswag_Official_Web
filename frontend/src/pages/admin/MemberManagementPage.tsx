// Member Management — the Secretary's Work module (Article VI §2(c)): applications, the
// roster, meeting minutes and announcements. Any non-Secretary hitting this page sees
// LockedState; the server also enforces it (requireOfficerPosition('SECRETARY') in
// member.routes.ts, PRO/SECRETARY in post.routes.ts). `?tab=` opens a tab directly.

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { usePortalToast } from '@/hooks/usePortalToast';
import { useApplicationDecision } from '@/hooks/useApplicationDecision';
import { listMembers, approveApplication, rejectApplication } from '@/services/memberService';
import { listNewsPosts, createManualPost } from '@/services/postService';
import { ForbiddenError } from '@/services/api';
import type { MemberProfile } from '@/types/member.types';
import { MEMBER_STANDING } from '@/components/admin/positions';
import type { NewsPost } from '@/types/post.types';
import { isSuperAdminEquivalent } from '@/utils/roles';
import LockedState from '@/components/common/LockedState';
import ApplicationReviewAids from '@/components/common/ApplicationReviewAids';
import PageHeader from '@/components/portal/PageHeader';
import Panel from '@/components/portal/Panel';
import StatPlate from '@/components/portal/StatPlate';
import PortalToast from '@/components/portal/PortalToast';
import { apiError, initials, timeAgo, formatDate } from '@/components/admin/format';

type Tab = 'pending' | 'active' | 'all' | 'minutes' | 'announcements';
const TABS: { key: Tab; label: string }[] = [
  { key: 'pending', label: 'Applications' },
  { key: 'active', label: 'Active' },
  { key: 'all', label: 'All members' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'announcements', label: 'Announcements' },
];

export default function MemberManagementPage() {
  const { user } = useAuth();
  // Instant optimistic lock; the real boundary is the server (see header).
  const canManage = isSuperAdminEquivalent(user) || user?.officerPosition === 'secretary';
  if (!canManage) {
    return (
      <div className="mp-page space-y-8">
        <PageHeader eyebrow="Members" title="Member management" />
        <LockedState
          title="Member management is the Secretary's"
          description="Only the Secretary (and the Super Admin) approve applications and keep the member roster, per Article VI §2(c) of the USWAG Constitution."
          redirectLabel="Contact the Secretary for membership matters"
        />
      </div>
    );
  }
  return <MemberManagementContent />;
}

// ---------------------------------------------------------------------------
// One member / application row
// ---------------------------------------------------------------------------
function MemberRow({
  member,
  onApprove,
  onReject,
  busy,
}: {
  member: MemberProfile;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  busy?: boolean;
}) {
  const [confirmReject, setConfirmReject] = useState(false);
  const pending = member.status === 'pending';

  return (
    // On a phone the decision buttons drop to their own full-width row under the details (thumb
    // targets, and the details get the whole line); side by side from sm up.
    <li className="ap-row items-start flex-wrap sm:flex-nowrap">
      <span className="ap-avatar" aria-hidden="true">{initials(member.name)}</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate">{member.name}</p>
        <p className="mp-muted text-[0.875rem] sm:truncate">
          {member.collegeOrDept}
          {member.yearLevel ? ` · ${member.yearLevel}` : ''}
          {pending ? ` · applied ${timeAgo(member.joinedAt)}` : member.serialNumber ? ` · ${member.serialNumber}` : ''}
        </p>
        <ApplicationReviewAids member={member} />
      </div>

      {pending && onApprove && onReject ? (
        <div className="flex gap-2 w-full pl-[3.375rem] sm:w-auto sm:pl-0 shrink-0 [&>*]:flex-1 sm:[&>*]:flex-none">
          {confirmReject ? (
            <>
              <button type="button" disabled={busy} onClick={() => onReject(member.id)} className="mp-btn mp-btn--danger mp-btn--sm">
                Confirm reject<span className="mp-sr-only"> {member.name}</span>
              </button>
              <button type="button" onClick={() => setConfirmReject(false)} className="mp-btn mp-btn--ghost mp-btn--sm">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button type="button" disabled={busy} onClick={() => onApprove(member.id)} className="mp-btn mp-btn--primary mp-btn--sm">
                Approve<span className="mp-sr-only"> {member.name}</span>
              </button>
              <button type="button" disabled={busy} onClick={() => setConfirmReject(true)} className="mp-btn mp-btn--ghost mp-btn--sm">
                Reject<span className="mp-sr-only"> {member.name}</span>
              </button>
            </>
          )}
        </div>
      ) : (
        <span className={`mp-standing mp-standing--${member.status} shrink-0`}>{MEMBER_STANDING[member.status]}</span>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Minutes / announcements: composer + what's already been published
// ---------------------------------------------------------------------------
function Composer({ type, onPublished }: { type: 'MINUTE' | 'ANNOUNCEMENT'; onPublished: (msg: string, ok?: boolean) => void }) {
  const [body, setBody] = useState('');
  const queryClient = useQueryClient();
  const { data: posts, isLoading } = useQuery<NewsPost[]>({ queryKey: ['posts'], queryFn: listNewsPosts, staleTime: 60_000 });
  const mutation = useMutation({
    mutationFn: () => createManualPost(body.trim(), undefined, type),
    onSuccess: () => {
      setBody('');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      onPublished(type === 'MINUTE' ? 'Minutes published' : 'Announcement posted');
    },
    onError: (err) => onPublished(apiError(err, 'Could not publish. Please try again.'), false),
  });
  const label = type === 'MINUTE' ? 'Meeting minutes' : 'Announcement';
  const published = (posts ?? []).filter((p) => p.type === type);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
      <Panel title={type === 'MINUTE' ? 'Publish minutes' : 'Post an announcement'} id={`compose-${type}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim()) mutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor={`compose-${type}-body`} className="ap-label">{label}</label>
            <textarea
              id={`compose-${type}-body`}
              rows={type === 'MINUTE' ? 10 : 5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={type === 'MINUTE' ? 'Paste or write the meeting minutes…' : 'Write an update for members…'}
              className="ap-input"
            />
            <p className="ap-hint">Visible to members and on the public News page.</p>
          </div>
          <button type="submit" disabled={mutation.isPending || !body.trim()} className="mp-btn mp-btn--primary">
            {mutation.isPending ? 'Publishing…' : type === 'MINUTE' ? 'Publish minutes' : 'Post announcement'}
          </button>
        </form>
      </Panel>

      <Panel title={type === 'MINUTE' ? 'Published minutes' : 'Recent announcements'} aside={<span className="mp-muted">{published.length}</span>} flush>
        {isLoading ? (
          <div className="p-5 space-y-3" aria-busy="true">{[0, 1].map((i) => <div key={i} className="mp-skeleton h-12" />)}</div>
        ) : published.length === 0 ? (
          <p className="p-6 mp-muted text-center">Nothing published yet.</p>
        ) : (
          <ul className="ap-list">
            {published.slice(0, 8).map((p) => (
              <li key={p.id} className="ap-row">
                <div className="min-w-0">
                  <p className="text-[0.9375rem] line-clamp-2">{p.body}</p>
                  <p className="mp-muted text-[0.8125rem] mt-0.5">{formatDate(p.publishedAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function MemberManagementContent() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'pending') as Tab;
  const [search, setSearch] = useState('');
  const { toast, show } = usePortalToast();

  const pendingQ = useQuery<MemberProfile[]>({ queryKey: ['members', 'pending'], queryFn: () => listMembers({ status: 'pending' }), staleTime: 30_000 });
  const activeQ = useQuery<MemberProfile[]>({ queryKey: ['members', 'active'], queryFn: () => listMembers({ status: 'active' }), staleTime: 30_000 });
  const allQ = useQuery<MemberProfile[]>({ queryKey: ['members', 'all'], queryFn: () => listMembers(), staleTime: 30_000, enabled: tab === 'all' });

  const approve = useApplicationDecision(approveApplication, 'Application approved', show);
  const reject = useApplicationDecision((id) => rejectApplication(id), 'Application rejected', show);

  if (pendingQ.error instanceof ForbiddenError || activeQ.error instanceof ForbiddenError) {
    return (
      <div className="mp-page space-y-8">
        <PageHeader eyebrow="Members" title="Member management" />
        <LockedState
          title="The server refused access"
          description="The server confirmed that member management is outside your role's scope. It's restricted to the Secretary and the Super Admin (Article VI §2(c))."
        />
      </div>
    );
  }

  const list = tab === 'pending' ? pendingQ.data : tab === 'active' ? activeQ.data : allQ.data;
  const loading = tab === 'pending' ? pendingQ.isLoading : tab === 'active' ? activeQ.isLoading : allQ.isLoading;
  const q = search.trim().toLowerCase();
  const shown = (list ?? []).filter((m) => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.serialNumber?.toLowerCase().includes(q));
  const busy = approve.isPending || reject.isPending;

  return (
    <div className="mp-page space-y-8">
      <PageHeader eyebrow="Work · Secretary" title="Members" lead="Review applications, keep the roster, and publish minutes and announcements." />

      <dl className="grid grid-cols-2 gap-3 max-w-md">
        <StatPlate label="Pending" value={pendingQ.data?.length ?? '…'} tone={pendingQ.data?.length ? 'warn' : 'neutral'} hint="Applications" />
        <StatPlate label="Active" value={activeQ.data?.length ?? '…'} tone="primary" hint="Members" />
      </dl>

      <div role="group" aria-label="Show" className="flex gap-2 overflow-x-auto uw-scroll-hidden -mx-1 px-1 pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={tab === t.key}
            className="mp-chip"
            onClick={() => setParams(t.key === 'pending' ? {} : { tab: t.key }, { replace: true })}
          >
            {t.label}
            {t.key === 'pending' && pendingQ.data?.length ? ` · ${pendingQ.data.length}` : ''}
          </button>
        ))}
      </div>

      {tab === 'minutes' || tab === 'announcements' ? (
        <Composer type={tab === 'minutes' ? 'MINUTE' : 'ANNOUNCEMENT'} onPublished={(m, ok = true) => show(m, ok ? 'ok' : 'error')} />
      ) : (
        <Panel
          title={tab === 'pending' ? 'Applications awaiting review' : tab === 'active' ? 'Active members' : 'All members'}
          aside={!loading && <span className="mp-muted">{shown.length} shown</span>}
          flush
        >
          {tab !== 'pending' && (
            <div className="p-4 sm:px-6 border-b border-[rgb(20_39_24/0.1)]">
              <label htmlFor="member-search" className="mp-sr-only">Search members</label>
              <div className="ap-search max-w-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <input id="member-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email or serial" className="ap-input" />
              </div>
            </div>
          )}
          {loading ? (
            <div className="p-5 space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-14" />)}</div>
          ) : shown.length === 0 ? (
            <p className="p-8 mp-muted text-center">
              {tab === 'pending' ? 'No applications waiting. New ones appear here as soon as they’re submitted.' : q ? 'No members match your search.' : 'No members here yet.'}
            </p>
          ) : (
            <ul className="ap-list">
              {shown.map((m) => (
                <MemberRow key={m.id} member={m} busy={busy} onApprove={(id) => approve.mutate(id)} onReject={(id) => reject.mutate(id)} />
              ))}
            </ul>
          )}
        </Panel>
      )}

      <PortalToast toast={toast} />
    </div>
  );
}
