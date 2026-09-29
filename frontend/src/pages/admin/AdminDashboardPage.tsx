// Officer Admin Home — mobile-first, one view per officer position (Article VI §2).
// Every stat / action / activity entry is fetched from a real endpoint. Where the org has no
// backing data for something (audit reports, discrepancy tracking), it isn't shown as a
// number — it's either replaced by a real figure or left out.

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { getFinanceSummary, listFinanceEntries } from '@/services/financeService';
import { getAttendanceStats } from '@/services/attendanceService';
import { listNewsPosts } from '@/services/postService';
import { listPurchaseRequests } from '@/services/procurementService';
import { listMembers } from '@/services/memberService';
import type { MemberProfile } from '@/types/member.types';
import type { FinanceSummary, FinanceEntry } from '@/types/finance.types';
import type { AttendanceStats } from '@/types/event.types';
import type { NewsPost } from '@/types/post.types';
import type { PurchaseRequest } from '@/types/procurement.types';
import NotificationBell from '@/components/pwa/NotificationBell';
import PageHeader from '@/components/portal/PageHeader';
import Panel from '@/components/portal/Panel';
import StatPlate, { type StatTone } from '@/components/portal/StatPlate';
import { positionLabel } from '@/components/admin/positions';
import { currency, currentAcademicYear, isThisMonth, timeAgo } from '@/components/admin/format';

// ---------------------------------------------------------------------------
// Icons (stroke, currentColor)
// ---------------------------------------------------------------------------
const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const I = {
  people: svg(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>),
  doc: svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M9 13h6M9 17h6" /></>),
  peso: svg(<><path d="M7 21V4h6a4.5 4.5 0 0 1 0 9H7" /><path d="M4 8h14M4 11h14" /></>),
  check: svg(<><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>),
  alert: svg(<><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></>),
  ledger: svg(<><path d="M9 11l2 2 4-4" /><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 17h8" /></>),
  box: svg(<><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></>),
  clock: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  pen: svg(<><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></>),
  chart: svg(<><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></>),
  sync: svg(<><path d="M21 12a9 9 0 0 1-15.5 6.2M3 12a9 9 0 0 1 15.5-6.2" /><path d="M3 20v-5h5M21 4v5h-5" /></>),
  megaphone: svg(<><path d="m3 11 18-5v12L3 13v-2z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></>),
  scan: svg(<><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /></>),
  store: svg(<><path d="M3 9l1-5h16l1 5" /><path d="M4 9v11h16V9M9 20v-6h6v6" /></>),
};

interface Stat { icon: ReactNode; label: string; value: ReactNode; tone: StatTone; hint?: string }
interface Action { icon: ReactNode; title: string; sub: string; to: string }
interface Activity { icon: ReactNode; text: ReactNode; time: string }

// ---------------------------------------------------------------------------
// Shell — layout only; each position component fetches its own data.
// ---------------------------------------------------------------------------
function OfficerHome({
  scope,
  lead,
  stats,
  statsLoading,
  actions,
  activity,
  activityLoading,
}: {
  scope: string[];
  lead: string;
  stats: Stat[];
  statsLoading: boolean;
  actions: Action[];
  activity: Activity[];
  activityLoading: boolean;
}) {
  const { user } = useAuth();
  if (!user) return null;
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';

  // Mobile-first order (most officers are on a phone): who you are, then what you came to do,
  // then the numbers. The first action is the position's main task and gets the dark tile.
  return (
    <div className="mp-page space-y-8 sm:space-y-10">
      <PageHeader
        eyebrow={`Officer console · A.Y. ${currentAcademicYear()}`}
        title={`${greeting}, ${user.name.trim().split(/\s+/)[0]}.`}
        actions={<NotificationBell />}
      />

      {/* Office plate: the position and exactly what it covers (Article VI §2) */}
      <section aria-label="Your office" className="mp-vault mp-vault--framed mp-vault--panel mp-on-dark px-6 py-6 sm:p-9">
        <div className="relative max-w-[52ch]">
          <p className="mp-eyebrow" style={{ color: 'var(--color-sage)' }}>Office of the</p>
          <p className="font-heading font-semibold text-[1.5rem] sm:text-[2rem] leading-tight text-mist mt-1">
            {positionLabel(user.officerPosition)}
          </p>
          <p className="mp-muted mt-2 text-[0.875rem] sm:text-[0.9375rem]">{lead}</p>
          <ul className="ap-snap-row flex gap-2 mt-4 sm:mt-5 sm:flex-wrap" aria-label="Scope">
            {scope.map((s) => (
              <li key={s} className="mp-standing mp-standing--active shrink-0">{s}</li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="oh-actions">
        <h2 id="oh-actions" className="mp-h2">Quick actions</h2>
        <ul className="ap-tiles mt-4">
          {actions.map((a, i) => (
            <li key={a.title}>
              <Link to={a.to} className={`ap-tile mp-lift ${i === 0 ? 'ap-tile--primary mp-on-dark' : 'mp-card'}`}>
                <span className="mp-seal ap-tile__seal [&>svg]:w-5 [&>svg]:h-5" aria-hidden="true">{a.icon}</span>
                <span className="min-w-0">
                  <span className="ap-tile__title">{a.title}</span>
                  <span className="ap-tile__sub mp-muted">{a.sub}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="oh-numbers">
        <h2 id="oh-numbers" className="mp-h2">At a glance</h2>
        {statsLoading ? (
          <div className="ap-stats-row mt-4" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-28" />)}
          </div>
        ) : (
          <dl className="ap-stats-row mt-4">
            {stats.map((s) => (
              <StatPlate key={s.label} icon={s.icon} label={s.label} value={s.value} tone={s.tone} hint={s.hint} />
            ))}
          </dl>
        )}
      </section>

      <Panel title="Recent activity" id="oh-activity" flush>
        {activityLoading ? (
          <div className="p-5 space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-12" />)}
          </div>
        ) : activity.length === 0 ? (
          <p className="p-6 mp-muted text-center">Nothing yet. Activity in your area appears here as it happens.</p>
        ) : (
          <ul className="ap-list">
            {activity.map((a, i) => (
              <li key={i} className="ap-row">
                <span className="ap-avatar [&>svg]:w-4 [&>svg]:h-4" aria-hidden="true">{a.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] leading-snug truncate">{a.text}</p>
                  <p className="mp-muted text-[0.8125rem] mt-0.5">{a.time}</p>
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
// Secretary — Members · Minutes · Announcements · Scan
// ---------------------------------------------------------------------------
function SecretaryHome() {
  // Counts come from the member lists (the Secretary's own scope) — the finance summary is
  // Treasurer / Auditor / Super Admin only and the server refuses it to the Secretary.
  const { data: pendingList, isLoading: pLoadingMembers } = useQuery<MemberProfile[]>({ queryKey: ['members', 'pending'], queryFn: () => listMembers({ status: 'pending' }), staleTime: 30_000 });
  const { data: activeList, isLoading: aLoadingMembers } = useQuery<MemberProfile[]>({ queryKey: ['members', 'active'], queryFn: () => listMembers({ status: 'active' }), staleTime: 30_000 });
  const { data: posts, isLoading: pLoading } = useQuery<NewsPost[]>({ queryKey: ['posts'], queryFn: listNewsPosts, staleTime: 60_000 });
  const orgPosts = (posts ?? []).filter((p) => p.type === 'MINUTE' || p.type === 'ANNOUNCEMENT');
  const pending = pendingList?.length ?? 0;
  const sLoading = pLoadingMembers || aLoadingMembers;

  return (
    <OfficerHome
      scope={['Members', 'Minutes', 'Announcements', 'Scan']}
      lead="You keep the membership record: applications, the roster, minutes and announcements."
      stats={[
        { icon: I.people, label: 'Pending', value: pending, tone: pending ? 'warn' : 'neutral', hint: 'Applications' },
        { icon: I.check, label: 'Active', value: activeList?.length ?? 0, tone: 'primary', hint: 'Members' },
        { icon: I.pen, label: 'This month', value: orgPosts.filter((p) => isThisMonth(p.publishedAt)).length, tone: 'neutral', hint: 'Minutes & notices' },
      ]}
      statsLoading={sLoading || pLoading}
      actions={[
        { icon: I.people, title: 'Review applications', sub: `${pending} pending`, to: '/admin/work?tab=pending' },
        { icon: I.doc, title: 'Meeting minutes', sub: 'Publish minutes', to: '/admin/work?tab=minutes' },
        { icon: I.megaphone, title: 'Announcement', sub: 'Notify members', to: '/admin/work?tab=announcements' },
        { icon: I.scan, title: 'Scan console', sub: 'Check members in', to: '/admin/scan' },
      ]}
      activity={orgPosts.slice(0, 4).map((p) => ({
        icon: p.type === 'MINUTE' ? I.doc : I.megaphone,
        text: <>{p.type === 'MINUTE' ? 'Minutes published: ' : 'Announcement: '}<b className="font-semibold">{p.body.slice(0, 70)}</b></>,
        time: timeAgo(p.publishedAt),
      }))}
      activityLoading={pLoading}
    />
  );
}

// ---------------------------------------------------------------------------
// Treasurer — Dues · Expenses · Financial Reports · Scan
// ---------------------------------------------------------------------------
function TreasurerHome() {
  const { data: summary, isLoading: sLoading } = useQuery<FinanceSummary>({ queryKey: ['finance', 'summary'], queryFn: getFinanceSummary, staleTime: 60_000 });
  const { data: entries, isLoading: eLoading } = useQuery<FinanceEntry[]>({ queryKey: ['finance', 'entries', 'recent'], queryFn: () => listFinanceEntries({ limit: 5 }), staleTime: 60_000 });

  return (
    <OfficerHome
      scope={['Dues', 'Expenses', 'Financial reports', 'Scan']}
      lead="You keep the books: every peso of dues in, every expense out."
      stats={[
        { icon: I.peso, label: 'On hand', value: currency(summary?.fundsOnHand ?? 0), tone: 'primary', hint: 'Funds' },
        { icon: I.check, label: 'Collected', value: currency(summary?.totalDues ?? 0), tone: 'primary', hint: 'Dues' },
        { icon: I.alert, label: 'Outstanding', value: currency(summary?.pendingDuesAmount ?? 0), tone: 'warn', hint: 'Dues to follow up' },
      ]}
      statsLoading={sLoading}
      actions={[
        { icon: I.peso, title: 'Record payment', sub: 'Log a dues payment', to: '/admin/work?focus=record-dues' },
        { icon: I.chart, title: 'Log expense', sub: 'Track spending', to: '/admin/work?focus=record-expense' },
        { icon: I.ledger, title: 'Ledger', sub: 'Recent entries', to: '/admin/work?focus=ledger' },
        { icon: I.scan, title: 'Scan console', sub: 'Check members in', to: '/admin/scan' },
      ]}
      activity={(entries ?? []).slice(0, 4).map((e) => ({
        icon: e.type === 'DUES' ? I.peso : I.chart,
        text: e.type === 'DUES' ? <>Dues recorded: <b className="font-semibold">{e.description}</b></> : <>Expense: <b className="font-semibold">{e.description} · {currency(e.amount)}</b></>,
        time: timeAgo(e.createdAt),
      }))}
      activityLoading={eLoading}
    />
  );
}

// ---------------------------------------------------------------------------
// Auditor — Financial Review · Attendance Records (read-only; no scan, Article VI)
// ---------------------------------------------------------------------------
function AuditorHome() {
  const { data: stats, isLoading: aLoading } = useQuery<AttendanceStats>({ queryKey: ['attendance', 'stats'], queryFn: getAttendanceStats, staleTime: 60_000 });
  const { data: entries, isLoading: eLoading } = useQuery<FinanceEntry[]>({ queryKey: ['finance', 'entries', 'audit'], queryFn: () => listFinanceEntries({ limit: 20 }), staleTime: 60_000 });
  const cutoff = Date.now() - 30 * 24 * 3600_000;
  const recentExpenses = (entries ?? []).filter((e) => e.type === 'EXPENSE' && new Date(e.createdAt).getTime() > cutoff);

  return (
    <OfficerHome
      scope={['Financial review', 'Attendance records', 'Read-only']}
      lead="You hold the record to account: finances and attendance, read-only, with no scanning or entries of your own."
      stats={[
        { icon: I.doc, label: 'To review', value: recentExpenses.length, tone: recentExpenses.length ? 'warn' : 'neutral', hint: 'Expenses, last 30 days' },
        { icon: I.check, label: 'Valid scans', value: `${stats?.validRate ?? 0}%`, tone: 'primary', hint: 'Of all scans' },
        { icon: I.ledger, label: 'Scans', value: stats?.totalScans ?? 0, tone: 'neutral', hint: 'On record' },
      ]}
      statsLoading={aLoading || eLoading}
      actions={[
        { icon: I.ledger, title: 'Finance ledger', sub: 'Read-only', to: '/admin/work?focus=audit-ledger' },
        { icon: I.check, title: 'Attendance records', sub: 'Cross-check scans', to: '/admin/work?focus=audit-attendance' },
      ]}
      activity={(entries ?? []).slice(0, 4).map((e) => ({
        icon: e.type === 'DUES' ? I.peso : I.chart,
        text: e.type === 'DUES' ? <>Dues recorded by the Treasurer: <b className="font-semibold">{e.description}</b></> : <>Expense logged: <b className="font-semibold">{e.description} · {currency(e.amount)}</b></>,
        time: timeAgo(e.createdAt),
      }))}
      activityLoading={eLoading}
    />
  );
}

// ---------------------------------------------------------------------------
// Business Manager — Procurement · Supplier Coordination · Scan
// ---------------------------------------------------------------------------
function BusinessManagerHome() {
  const { data: requests, isLoading } = useQuery<PurchaseRequest[]>({ queryKey: ['procurement', 'requests'], queryFn: listPurchaseRequests, staleTime: 60_000 });
  const list = requests ?? [];
  const pending = list.filter((r) => r.status === 'PENDING').length;
  const STATUS: Record<PurchaseRequest['status'], string> = { PENDING: 'Requested', APPROVED: 'Approved', REJECTED: 'Rejected' };

  return (
    <OfficerHome
      scope={['Procurement', 'Suppliers', 'Scan']}
      lead="You source what events need: purchase requests and the supplier directory."
      stats={[
        { icon: I.box, label: 'Open', value: list.filter((r) => r.status !== 'REJECTED').length, tone: 'primary', hint: 'Requests' },
        { icon: I.peso, label: 'This month', value: currency(list.filter((r) => isThisMonth(r.createdAt)).reduce((s, r) => s + r.estimatedCost, 0)), tone: 'neutral', hint: 'Requested' },
        { icon: I.clock, label: 'Awaiting', value: pending, tone: pending ? 'warn' : 'neutral', hint: 'Approval' },
      ]}
      statsLoading={isLoading}
      actions={[
        { icon: I.box, title: 'New request', sub: 'Materials for events', to: '/admin/work?focus=new-request' },
        { icon: I.store, title: 'Suppliers', sub: 'Directory', to: '/admin/work?focus=suppliers' },
        { icon: I.scan, title: 'Scan console', sub: 'Check members in', to: '/admin/scan' },
      ]}
      activity={[...list]
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
        .slice(0, 4)
        .map((r) => ({ icon: I.box, text: <>{STATUS[r.status]}: <b className="font-semibold">{r.item}</b> · {currency(r.estimatedCost)}</>, time: timeAgo(r.createdAt) }))}
      activityLoading={isLoading}
    />
  );
}

// ---------------------------------------------------------------------------
// PRO — News · Social Content · Scan (assigned events)
// ---------------------------------------------------------------------------
function ProHome() {
  const { data: posts, isLoading } = useQuery<NewsPost[]>({ queryKey: ['posts'], queryFn: listNewsPosts, staleTime: 60_000 });
  const list = posts ?? [];
  const synced = list.filter((p) => p.source === 'facebook');
  const cutoff = Date.now() - 30 * 24 * 3600_000;
  const reach = synced.filter((p) => new Date(p.publishedAt).getTime() > cutoff).reduce((s, p) => s + (p.likeCount ?? 0) + (p.commentCount ?? 0), 0);

  return (
    <OfficerHome
      scope={['News', 'Facebook sync', 'Scan (assigned events)']}
      lead="You tell USWAG's story: news posts and the Facebook Page sync."
      stats={[
        { icon: I.pen, label: 'This month', value: list.filter((p) => isThisMonth(p.publishedAt)).length, tone: 'neutral', hint: 'Posts' },
        { icon: I.chart, label: 'Reach', value: reach >= 1000 ? `${(reach / 1000).toFixed(1)}K` : reach, tone: 'primary', hint: 'Likes + comments, 30 days' },
        { icon: I.sync, label: 'Synced', value: synced.length, tone: 'primary', hint: 'From Facebook' },
      ]}
      statsLoading={isLoading}
      actions={[
        { icon: I.pen, title: 'New post', sub: 'Write an update', to: '/admin/work?focus=new-post' },
        { icon: I.sync, title: 'Facebook sync', sub: 'Check the Page', to: '/admin/work?focus=fb-sync' },
        { icon: I.scan, title: 'Scan console', sub: 'Assigned events', to: '/admin/scan' },
      ]}
      activity={list.slice(0, 4).map((p) => ({
        icon: p.source === 'facebook' ? I.sync : I.pen,
        text: <>{p.source === 'facebook' ? 'Synced from Facebook: ' : 'Posted: '}<b className="font-semibold">{p.body.slice(0, 70)}</b></>,
        time: timeAgo(p.publishedAt),
      }))}
      activityLoading={isLoading}
    />
  );
}

// ---------------------------------------------------------------------------
// Entry point — by position. The VP is Super-Admin-equivalent and never lands here
// (AdminHomePage routes them to SuperAdminDashboardPage).
// ---------------------------------------------------------------------------
export default function AdminDashboardPage() {
  const { user } = useAuth();
  if (!user?.officerPosition) return null;
  switch (user.officerPosition) {
    case 'secretary':
      return <SecretaryHome />;
    case 'treasurer':
      return <TreasurerHome />;
    case 'auditor':
      return <AuditorHome />;
    case 'business_manager':
      return <BusinessManagerHome />;
    case 'pro':
      return <ProHome />;
    default:
      return (
        <div className="mp-page">
          <PageHeader eyebrow="Officer console" title={`Welcome, ${user.name}.`} lead="Your position doesn't have a dashboard view yet." />
        </div>
      );
  }
}
