// Super Admin Dashboard — desktop-first (CLAUDE.md: "Super Admin is desktop-first").
// Org-wide numbers, membership and scan charts, the applications waiting for a decision,
// recent audited activity and what's coming up. Every figure is fetched; nothing here is a
// literal. Charts are the console's hand-built bars (StackedBar / BarList / Meter).

import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { usePortalToast } from '@/hooks/usePortalToast';
import { useApplicationDecision } from '@/hooks/useApplicationDecision';
import { getFinanceSummary } from '@/services/financeService';
import { listEvents } from '@/services/eventService';
import { getAttendanceStats } from '@/services/attendanceService';
import { listMembers, approveApplication, rejectApplication } from '@/services/memberService';
import { listAuditLog, type AuditLogEntry } from '@/services/adminService';
import type { FinanceSummary } from '@/types/finance.types';
import type { UswagEvent, AttendanceStats } from '@/types/event.types';
import type { MemberProfile } from '@/types/member.types';
import { PILLAR_LABELS, STATUS_LABELS } from '@/types/event.types';
import NotificationBell from '@/components/pwa/NotificationBell';
import PageHeader from '@/components/portal/PageHeader';
import Panel from '@/components/portal/Panel';
import StatPlate from '@/components/portal/StatPlate';
import PortalToast from '@/components/portal/PortalToast';
import StackedBar from '@/components/admin/StackedBar';
import BarList from '@/components/admin/BarList';
import Meter from '@/components/admin/Meter';
import { auditSentence, auditTone } from '@/components/admin/audit';
import { EVENT_BADGE, signupMeter } from '@/components/admin/events';
import { groupByCollege, standingSegments } from '@/components/admin/memberCharts';
import { currentAcademicYear, formatDate, initials, timeAgo } from '@/components/admin/format';
import FeeLine from '@/components/admin/FeeLine';
import { feeAllowsActivation } from '@/components/admin/fee';

const UPCOMING_COLS = 'minmax(14rem,2.2fr) minmax(7rem,0.9fr) minmax(10rem,1.2fr) 8rem';

const svg = (d: JSX.Element) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast, show } = usePortalToast();

  const summaryQ = useQuery<FinanceSummary>({ queryKey: ['finance', 'summary'], queryFn: getFinanceSummary, staleTime: 60_000 });
  const eventsQ = useQuery<UswagEvent[]>({ queryKey: ['events'], queryFn: listEvents, staleTime: 60_000 });
  const attendanceQ = useQuery<AttendanceStats>({ queryKey: ['attendance', 'stats'], queryFn: getAttendanceStats, staleTime: 60_000 });
  // The whole roster (same cache as the Members board): the charts need every standing, and the
  // pending applications are just a slice of it.
  const membersQ = useQuery<MemberProfile[]>({ queryKey: ['members', 'all'], queryFn: () => listMembers(), staleTime: 30_000 });
  const auditQ = useQuery<AuditLogEntry[]>({ queryKey: ['audit-log', 'recent'], queryFn: listAuditLog, staleTime: 60_000 });

  const approve = useApplicationDecision(approveApplication, 'Application approved', show);
  const reject = useApplicationDecision((id) => rejectApplication(id), 'Application rejected', show);

  const now = new Date();
  const eventsThisMonth = (eventsQ.data ?? []).filter((e) => {
    const d = new Date(e.startsAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const upcoming = (eventsQ.data ?? [])
    .filter((e) => new Date(e.startsAt) >= now && e.status !== 'CANCELLED')
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))
    .slice(0, 5);
  const allMembers = membersQ.data ?? [];
  const pending = allMembers.filter((m) => m.status === 'pending').sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt));
  const colleges = groupByCollege(allMembers);
  const busiest = Math.max(0, ...upcoming.map((e) => e._count?.rsvps ?? 0));
  const scans = attendanceQ.data;
  const h = now.getHours();
  const greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const busy = approve.isPending || reject.isPending;
  const loadingStats = summaryQ.isLoading || eventsQ.isLoading || attendanceQ.isLoading;

  return (
    <div className="mp-page space-y-8">
      <PageHeader
        eyebrow={`Admin console · A.Y. ${currentAcademicYear()} · ${now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}`}
        title={`${greeting}, ${user?.name.trim().split(/\s+/)[0] ?? ''}.`}
        lead="Here’s what’s happening across USWAG today."
        actions={
          <>
            <NotificationBell />
            <Link to="/admin/events?new=1" className="mp-btn mp-btn--primary">+ New event</Link>
          </>
        }
      />

      {loadingStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="mp-skeleton h-28" />)}</div>
      ) : (
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatPlate icon={svg(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>)} label="Active members" value={summaryQ.data?.activeMembers ?? 0} tone="primary" />
          <StatPlate icon={svg(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M20 8v6M23 11h-6" /></>)} label="Pending applications" value={summaryQ.data?.pendingApplications ?? 0} tone={summaryQ.data?.pendingApplications ? 'warn' : 'neutral'} />
          <StatPlate icon={svg(<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>)} label="Events this month" value={eventsThisMonth} tone="neutral" />
          <StatPlate icon={svg(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></>)} label="Valid scan rate" value={`${attendanceQ.data?.validRate ?? 0}%`} tone="primary" hint={`${attendanceQ.data?.totalScans ?? 0} scans on record`} />
        </dl>
      )}

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
        <Panel title="Membership" aside={<Link to="/admin/members" className="mp-link">Open the board</Link>}>
          {membersQ.isLoading ? (
            <div className="space-y-3" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="mp-skeleton h-6" />)}</div>
          ) : (
            <>
              <StackedBar label="Members by standing" segments={standingSegments(allMembers)} legend size="lg" />
              <p className="mp-eyebrow mt-7 mb-2" style={{ fontSize: '0.6875rem' }}>By college</p>
              <BarList
                label="Members by college, split by standing"
                rows={colleges.slice(0, 6).map((c) => ({ key: c.key, label: c.label, segments: standingSegments(c.members) }))}
                onSelect={(key) => navigate(`/admin/members?college=${encodeURIComponent(key)}`)}
                empty="No members yet."
              />
              {colleges.length > 6 && (
                <p className="mp-muted text-[0.8125rem] mt-2 px-2.5">
                  and {colleges.length - 6} more on the <Link to="/admin/members" className="mp-link">Members board</Link>
                </p>
              )}
            </>
          )}
        </Panel>

        <Panel title="Scan outcomes" aside={<Link to="/admin/scan" className="mp-link">Scan console</Link>}>
          {attendanceQ.isLoading ? (
            <div className="mp-skeleton h-28" aria-busy="true" />
          ) : (
            <>
              <p className="mp-stat text-primary">{scans?.validRate ?? 0}%</p>
              <p className="mp-muted text-[0.8125rem] mt-1">of {scans?.totalScans ?? 0} scans were valid</p>
              <StackedBar
                className="mt-5"
                label="Scans by outcome"
                size="lg"
                legend
                segments={[
                  { label: 'Valid', value: scans?.validScans ?? 0, tone: 'success' },
                  { label: 'Expired', value: scans?.expiredScans ?? 0, tone: 'warn' },
                  { label: 'Invalid', value: scans?.invalidScans ?? 0, tone: 'danger' },
                ]}
              />
              <p className="mp-muted text-[0.8125rem] mt-5 leading-relaxed">
                Expired means the member hasn’t renewed for this academic year; invalid means the card didn’t verify. Repeated invalid scans are worth a look in the audit log.
              </p>
            </>
          )}
        </Panel>
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-start">
        <Panel title="Applications awaiting a decision" aside={<Link to="/admin/members?filter=pending" className="mp-link">All applications</Link>} flush>
          {membersQ.isLoading ? (
            <div className="p-5 space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-12" />)}</div>
          ) : pending.length === 0 ? (
            <p className="p-8 mp-muted text-center">No applications waiting.</p>
          ) : (
            <ul className="ap-list">
              {pending.slice(0, 6).map((m) => (
                <li key={m.id} className="ap-row">
                  <span className="ap-avatar" aria-hidden="true">{initials(m.name)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{m.name}</p>
                    <p className="mp-muted text-[0.8125rem] truncate">
                      {m.collegeOrDept} · applied {timeAgo(m.joinedAt)}
                      {m.submittedByProxy ? ' · via a friend' : ''}
                      {m.nameMatches > 0 ? ' · same-name flag' : ''}
                    </p>
                    <FeeLine member={m} />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" disabled={busy || !feeAllowsActivation(m.fee)} aria-describedby={feeAllowsActivation(m.fee) ? undefined : `fee-block-${m.id}`} onClick={() => approve.mutate(m.id)} className="ap-iconbtn ap-iconbtn--ok" aria-label={`Approve ${m.name}`} title={feeAllowsActivation(m.fee) ? 'Approve' : 'The fee has to be recorded first'}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </button>
                    <button type="button" disabled={busy} onClick={() => reject.mutate(m.id)} className="ap-iconbtn ap-iconbtn--no" aria-label={`Reject ${m.name}`} title="Reject">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {pending.length > 0 && (
            <p className="px-5 sm:px-6 py-3 border-t border-[rgb(20_39_24/0.1)] mp-muted text-[0.8125rem]">
              To check a student ID or hand over a setup link, open <Link to="/admin/members?filter=pending" className="mp-link">Members</Link>.
            </p>
          )}
        </Panel>

        <Panel title="Recent activity" aside={<Link to="/admin/audit-log" className="mp-link">Audit log</Link>} flush>
          {auditQ.isLoading ? (
            <div className="p-5 space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-10" />)}</div>
          ) : !auditQ.data?.length ? (
            <p className="p-8 mp-muted text-center">No activity recorded yet.</p>
          ) : (
            <ul className="ap-list">
              {auditQ.data.slice(0, 6).map((e) => (
                <li key={e.id} className="ap-row items-start">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${auditTone(e.action) === 'rejected' ? 'bg-[var(--color-danger)]' : auditTone(e.action) === 'pending' ? 'bg-[var(--color-warn)]' : 'bg-[var(--color-primary)]'}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] leading-snug">{auditSentence(e)}</p>
                    <p className="mp-muted text-[0.8125rem] mt-0.5">{timeAgo(e.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Coming up" aside={<Link to="/admin/events" className="mp-link">Manage events</Link>} flush>
        {eventsQ.isLoading ? (
          <div className="p-5 space-y-3" aria-busy="true">{[0, 1].map((i) => <div key={i} className="mp-skeleton h-10" />)}</div>
        ) : upcoming.length === 0 ? (
          <p className="p-8 mp-muted text-center">No upcoming events scheduled.</p>
        ) : (
          <div className="ap-group" style={{ ['--ap-cols' as string]: UPCOMING_COLS }}>
            <div className="ap-board-row ap-board-row--head" aria-hidden="true">
              <span>Event</span>
              <span>Date</span>
              <span>Sign-ups</span>
              <span>Status</span>
            </div>
            {upcoming.map((e) => {
              const meter = signupMeter(e, busiest);
              return (
                <div key={e.id} className="ap-board-row">
                  <div>
                    <p className="font-semibold truncate">{e.title}</p>
                    <p className="mp-muted text-[0.8125rem] truncate">{PILLAR_LABELS[e.pillar]} · {e.scope === 'OUT_OF_CAMPUS' ? 'Out of campus' : 'In campus'}</p>
                  </div>
                  <div data-label="Date" className="mp-muted whitespace-nowrap text-[0.875rem]">{formatDate(e.startsAt)}</div>
                  <div data-label="Sign-ups"><Meter percent={meter.percent} text={meter.text} label="Sign-ups" tone={meter.tone} /></div>
                  <div data-label="Status"><span className={`mp-standing ${EVENT_BADGE[e.status]}`}>{STATUS_LABELS[e.status]}</span></div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <PortalToast toast={toast} />
    </div>
  );
}
