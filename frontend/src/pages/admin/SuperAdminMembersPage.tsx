// Members — Super Admin, desktop-first board: an overview (members per college, split by
// standing), then the roster as monday.com-style groups, one per college, each with its own
// standing summary. Search, standing filters, and inline decisions on pending applications
// (with the same review aids the Secretary gets). The Secretary uses MemberManagementPage
// (AdminMembersHomePage dispatches). `?filter=pending|active|expired|rejected` preselects a filter;
// `?college=<key>` opens and scrolls to that college's group.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePortalToast } from '@/hooks/usePortalToast';
import { prefersReducedMotion } from '@/lib/motion';
import { useApplicationDecision } from '@/hooks/useApplicationDecision';
import { listMembers, approveApplication, rejectApplication, renewMember } from '@/services/memberService';
import type { MemberProfile, MembershipStatus } from '@/types/member.types';
import ApplicationReviewAids from '@/components/common/ApplicationReviewAids';
import PageHeader from '@/components/portal/PageHeader';
import Panel from '@/components/portal/Panel';
import PortalToast from '@/components/portal/PortalToast';
import StackedBar from '@/components/admin/StackedBar';
import BarList from '@/components/admin/BarList';
import BoardGroup from '@/components/admin/BoardGroup';
import Meter from '@/components/admin/Meter';
import { MEMBER_STANDING } from '@/components/admin/positions';
import { collegeGroupId as groupId, groupByCollege as byCollege, standingSegments } from '@/components/admin/memberCharts';
import { apiError, initials, timeAgo } from '@/components/admin/format';

type Filter = 'all' | MembershipStatus;
const FILTERS: Filter[] = ['all', 'pending', 'active', 'expired', 'rejected'];
const COLS = 'minmax(15rem,2.4fr) minmax(8.5rem,1fr) minmax(9rem,1fr) 7.5rem 5.5rem';

export default function SuperAdminMembersPage() {
  const [params, setParams] = useSearchParams();
  const filter = (FILTERS.includes(params.get('filter') as Filter) ? params.get('filter') : 'all') as Filter;
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const { toast, show } = usePortalToast();

  const { data: members, isLoading, error } = useQuery<MemberProfile[]>({ queryKey: ['members', 'all'], queryFn: () => listMembers(), staleTime: 30_000 });
  const approve = useApplicationDecision(approveApplication, 'Application approved', show);
  const reject = useApplicationDecision((id) => rejectApplication(id), 'Application rejected', show);
  const renew = useApplicationDecision(renewMember, 'Membership renewed for this academic year', show);

  const list = useMemo(() => members ?? [], [members]);
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: list.length, active: 0, pending: 0, expired: 0, rejected: 0 };
    for (const m of list) c[m.status]++;
    return c;
  }, [list]);
  const allColleges = useMemo(() => byCollege(list), [list]);
  const accentOf = useMemo(() => new Map(allColleges.map((c, i) => [c.key, i])), [allColleges]);

  const q = search.trim().toLowerCase();
  const shown = list.filter(
    (m) => (filter === 'all' || m.status === filter) && (!q || m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.serialNumber?.toLowerCase().includes(q))
  );
  const groups = byCollege(shown);
  const busy = approve.isPending || reject.isPending || renew.isPending;
  const active = list.filter((m) => m.status === 'active');
  const avgAttendance = active.length ? Math.round(active.reduce((s, m) => s + m.attendanceRate, 0) / active.length) : 0;

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  function jumpTo(key: string) {
    // The overview counts everyone, so the group may be hidden by a filter or search — clear them.
    if (!groups.some((g) => g.key === key)) {
      setSearch('');
      setParams({}, { replace: true });
    }
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    // After the re-render that opens (or un-filters) the group
    setTimeout(() => document.getElementById(groupId(key))?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }), 50);
  }

  // `?college=<key>` (the dashboard's college chart) opens and scrolls to that group once loaded.
  // Once per link, not again on every refetch (e.g. after an approval).
  const collegeParam = params.get('college');
  const handledCollege = useRef<string | null>(null);
  useEffect(() => {
    if (!collegeParam || !members || handledCollege.current === collegeParam) return;
    handledCollege.current = collegeParam;
    setCollapsed(new Set());
    setTimeout(() => document.getElementById(groupId(collegeParam))?.scrollIntoView({ block: 'start' }), 50);
  }, [collegeParam, members]);

  return (
    <div className="mp-page !max-w-[1240px] space-y-8">
      <PageHeader
        eyebrow="Operations · Members"
        title="Members"
        lead={`${counts.active} active · ${counts.pending} pending application${counts.pending === 1 ? '' : 's'} · ${allColleges.length} college${allColleges.length === 1 ? '' : 's'}`}
      />

      {error && <p role="alert" className="mp-alert">{apiError(error, 'We couldn’t load members.')}</p>}

      {/* Overview */}
      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
        <Panel title="Members by college" aside={<span className="mp-muted">Tap a college to jump to it</span>}>
          {isLoading ? (
            <div className="space-y-3" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="mp-skeleton h-6" />)}</div>
          ) : (
            <BarList
              label="Members by college, split by standing"
              rows={allColleges.map((c) => ({ key: c.key, label: c.label, segments: standingSegments(c.members) }))}
              onSelect={jumpTo}
              empty="No members yet."
            />
          )}
        </Panel>

        <Panel title="Standing">
          {isLoading ? (
            <div className="mp-skeleton h-24" aria-busy="true" />
          ) : (
            <>
              <p className="mp-stat">{counts.all}</p>
              <p className="mp-muted text-[0.8125rem] mt-1">members on record</p>
              <StackedBar className="mt-5" label="Members by standing" segments={standingSegments(list)} legend size="lg" />
              <div className="mt-6 pt-5 border-t border-[rgb(20_39_24/0.1)]">
                <p className="mp-eyebrow" style={{ fontSize: '0.6875rem' }}>Average attendance · active members</p>
                <div className="mt-2">
                  <Meter percent={avgAttendance} text={active.length ? `${avgAttendance}%` : '—'} label="Average attendance" />
                </div>
              </div>
            </>
          )}
        </Panel>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="ap-search w-full lg:max-w-sm">
          <label htmlFor="sa-member-search" className="mp-sr-only">Search members</label>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input id="sa-member-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email or serial" className="ap-input" />
        </div>
        <div role="group" aria-label="Filter by standing" className="flex gap-2 overflow-x-auto uw-scroll-hidden -mx-1 px-1 pb-1 lg:flex-wrap lg:justify-end lg:ml-auto">
          {FILTERS.map((f) => (
            <button key={f} type="button" className="mp-chip shrink-0" aria-pressed={filter === f} onClick={() => setParams(f === 'all' ? {} : { filter: f }, { replace: true })}>
              {f === 'all' ? 'All' : MEMBER_STANDING[f]} · {counts[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Board */}
      {!isLoading && groups.length > 0 && (
        <div className="flex items-center gap-4 -mb-4 text-[0.8125rem]">
          <p className="mp-muted flex-1">
            {shown.length} member{shown.length === 1 ? '' : 's'} in {groups.length} college{groups.length === 1 ? '' : 's'}
          </p>
          <button type="button" className="mp-link" onClick={() => setCollapsed(new Set())}>Expand all</button>
          <button type="button" className="mp-link" onClick={() => setCollapsed(new Set(allColleges.map((c) => c.key)))}>Collapse all</button>
        </div>
      )}
      {isLoading ? (
        <div className="space-y-3" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="mp-skeleton h-14" />)}</div>
      ) : groups.length === 0 ? (
        <p className="mp-card p-10 mp-muted text-center">{q ? 'No members match your search.' : 'No members in this category yet.'}</p>
      ) : (
        <div className="ap-board" style={{ ['--ap-cols' as string]: COLS }}>
          {groups.map((g) => (
            <BoardGroup
              key={g.key}
              id={groupId(g.key)}
              title={g.label}
              count={`${g.members.length} member${g.members.length === 1 ? '' : 's'}`}
              accent={accentOf.get(g.key) ?? 0}
              summary={<StackedBar label={`${g.label} by standing`} segments={standingSegments(g.members)} />}
              open={!collapsed.has(g.key)}
              onToggle={() => toggle(g.key)}
              columns={
                <>
                  <span>Member</span>
                  <span>Serial</span>
                  <span>Attendance</span>
                  <span>Standing</span>
                  <span className="mp-sr-only">Actions</span>
                </>
              }
            >
              {g.members.map((m) => (
                <div key={m.id} className="ap-board-row">
                  <div className="flex items-start gap-3">
                    <span className="ap-avatar" aria-hidden="true">{initials(m.name)}</span>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{m.name || 'Unnamed'}</p>
                      <p className="mp-muted text-[0.8125rem] truncate">{m.email}</p>
                      {m.status === 'pending' && <p className="mp-muted text-[0.8125rem]">Applied {timeAgo(m.joinedAt)}</p>}
                      <ApplicationReviewAids member={m} />
                    </div>
                  </div>
                  <div data-label="Serial" className="font-mono text-[0.8125rem] whitespace-nowrap">{m.status === 'pending' ? '—' : m.serialNumber || '—'}</div>
                  <div data-label="Attendance">
                    {m.status === 'active' ? (
                      <Meter percent={m.attendanceRate} text={`${m.attendanceRate}%`} label="Attendance" tone={m.attendanceRate < 50 ? 'warn' : 'primary'} />
                    ) : (
                      <span className="mp-muted">—</span>
                    )}
                  </div>
                  <div data-label="Standing">
                    <span className={`mp-standing mp-standing--${m.status}`}>{MEMBER_STANDING[m.status]}</span>
                  </div>
                  <div className="flex gap-2 md:justify-end ml-auto md:ml-0">
                    {m.status === 'pending' && (
                      <>
                        <button type="button" disabled={busy} onClick={() => approve.mutate(m.id)} className="ap-iconbtn ap-iconbtn--ok" aria-label={`Approve ${m.name}`} title="Approve">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        </button>
                        <button type="button" disabled={busy} onClick={() => reject.mutate(m.id)} className="ap-iconbtn ap-iconbtn--no" aria-label={`Reject ${m.name}`} title="Reject">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                        </button>
                      </>
                    )}
                    {m.status === 'expired' && (
                      <button type="button" disabled={busy} onClick={() => renew.mutate(m.id)} className="ap-iconbtn ap-iconbtn--ok" aria-label={`Renew ${m.name}`} title="Renew for this academic year">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.7" /><path d="M20 4v5h-5" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </BoardGroup>
          ))}
        </div>
      )}

      <PortalToast toast={toast} />
    </div>
  );
}
