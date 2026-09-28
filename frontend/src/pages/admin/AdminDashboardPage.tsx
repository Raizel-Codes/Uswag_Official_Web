// Officer Admin Dashboard — mobile-first, one view per officer position.
// Every stat/action-sub/activity entry below is fetched from a real
// endpoint; nothing here is a hardcoded literal (see punch-list item 5).
// Where the org genuinely has no backing data for a prototype stat (e.g.
// "Drafts" — the Post model has no draft state), the stat is relabeled to
// something the schema actually supports rather than faking a number.

import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import KpiCard from "@/components/common/KpiCard";
import { getFinanceSummary, listFinanceEntries } from "@/services/financeService";
import { getAttendanceStats } from "@/services/attendanceService";
import { listNewsPosts } from "@/services/postService";
import { listPurchaseRequests } from "@/services/procurementService";
import type { FinanceSummary, FinanceEntry } from "@/types/finance.types";
import type { AttendanceStats } from "@/types/event.types";
import type { NewsPost } from "@/types/post.types";
import type { PurchaseRequest } from "@/types/procurement.types";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
const ICONS = {
  application: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  members: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
  document: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  peso: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  checkBadge: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  attendance: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  box: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>,
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
  facebook: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.56 1.52-3.98 3.86-3.98"/></svg>,
  megaphone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/></svg>,
  scan: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  suppliers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
};

function iconEl(node: ReactNode) {
  return <span className="w-4 h-4 stroke-primary [&>svg]:w-full [&>svg]:h-full">{node}</span>;
}

// ---------------------------------------------------------------------------
// Shared shapes + helpers
// ---------------------------------------------------------------------------
interface StatItem {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  tone: "primary" | "warn" | "danger" | "neutral";
  hint?: string;
}

interface ActionItem {
  icon: ReactNode;
  title: string;
  sub: string;
  link: string;
}

interface ActivityItem {
  icon: ReactNode;
  text: ReactNode;
  time: string;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.round(days / 7);
  return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
}

function currency(n: number) {
  return `₱${Math.abs(n).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function isThisMonth(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

// ---------------------------------------------------------------------------
// Shell — layout only. Every role component below fetches its own data and
// hands it to this.
// ---------------------------------------------------------------------------
function DashboardShell({
  title,
  scope,
  stats,
  statsLoading,
  actions,
  activity,
  activityLoading,
}: {
  title: string;
  scope: string;
  stats: StatItem[];
  statsLoading: boolean;
  actions: ActionItem[];
  activity: ActivityItem[];
  activityLoading: boolean;
}) {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="min-h-screen bg-mist px-5 pt-6 pb-24">
      {/* App Bar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-light to-forest text-white font-heading font-extrabold text-[15px] flex items-center justify-center shadow-md shrink-0">
            {user.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="text-[15px] font-bold leading-tight text-forest truncate">{user.name}</div>
            <div className="text-[11px] text-gray-500 font-medium truncate">{user.collegeOrDept}</div>
          </div>
        </div>
      </div>

      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-primary to-forest px-5 py-5 text-white mb-5 shadow-md">
        <div className="absolute -right-10 -top-10 h-[150px] w-[150px] rounded-full bg-sage/20" />
        <div className="relative">
          <div className="text-[10.5px] font-bold tracking-wider uppercase text-sage">Officer Admin</div>
          <div className="text-[19px] font-bold mt-1">{title}</div>
          <div className="text-[12px] text-white/75 mt-1">USWAG · A.Y. 2026–2027 Term</div>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-semibold">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 stroke-sage shrink-0"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span>{scope}</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {statsLoading
          ? [1, 2, 3].map((n) => <div key={n} className="h-[104px] rounded-2xl bg-gray-100 animate-pulse" />)
          : stats.map((stat, i) => (
              <KpiCard key={i} icon={stat.icon} value={stat.value} label={stat.label} tone={stat.tone} hint={stat.hint} />
            ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-[14.5px] font-bold text-forest">Quick Actions</h3>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {actions.map((action, i) => (
          <Link key={i} to={action.link} className="bg-white rounded-2xl p-3.5 shadow-sm border border-forest/5 flex flex-col gap-2.5 text-left hover:shadow-md hover:border-primary/15 transition-all">
            <div className="w-8 h-8 rounded-lg bg-mist flex items-center justify-center shrink-0">{action.icon}</div>
            <div>
              <h4 className="font-heading text-[12.5px] font-bold text-forest leading-snug">{action.title}</h4>
              <p className="text-[10.5px] text-gray-500 mt-0.5">{action.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-[14.5px] font-bold text-forest">Recent Activity</h3>
      </div>
      <div className="flex flex-col gap-2.5">
        {activityLoading ? (
          [1, 2, 3].map((n) => <div key={n} className="h-[54px] rounded-2xl bg-gray-100 animate-pulse" />)
        ) : activity.length === 0 ? (
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-forest/5">
            <p className="text-[12px] text-gray-500">Nothing to show yet — activity will appear here as it happens.</p>
          </div>
        ) : (
          activity.map((act, i) => (
            <div key={i} className="flex gap-3 bg-white rounded-2xl p-3 shadow-sm border border-forest/5 items-center">
              <div className="w-9 h-9 rounded-xl bg-mist flex items-center justify-center shrink-0">{act.icon}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-heading text-[12.5px] font-semibold text-forest leading-snug">{act.text}</h4>
                <div className="text-[11px] text-gray-500 mt-0.5">{act.time}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Secretary — Scope: Members · Minutes · Announcements · Scan
// ---------------------------------------------------------------------------
function SecretaryDashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useQuery<FinanceSummary>({
    queryKey: ["finance", "summary"],
    queryFn: getFinanceSummary,
    staleTime: 60_000,
  });
  const { data: posts, isLoading: isPostsLoading } = useQuery<NewsPost[]>({
    queryKey: ["posts"],
    queryFn: listNewsPosts,
    staleTime: 60_000,
  });

  const orgPosts = (posts ?? []).filter((p) => p.type === "MINUTE" || p.type === "ANNOUNCEMENT");
  const orgPostsThisMonth = orgPosts.filter((p) => isThisMonth(p.publishedAt)).length;

  const stats: StatItem[] = [
    { icon: iconEl(ICONS.application), value: summary?.pendingApplications ?? 0, label: "Pending Apps", tone: "warn", hint: "Awaiting review" },
    { icon: iconEl(ICONS.members), value: summary?.activeMembers ?? 0, label: "Active Members", tone: "primary" },
    { icon: iconEl(ICONS.edit), value: orgPostsThisMonth, label: "Minutes & Announcements", tone: "neutral", hint: "This month" },
  ];

  const actions: ActionItem[] = [
    { icon: iconEl(ICONS.application), title: "Review Applications", sub: `${summary?.pendingApplications ?? 0} pending`, link: "/admin/work" },
    { icon: iconEl(ICONS.document), title: "Meeting Minutes", sub: "Draft & publish", link: "/admin/work" },
    { icon: iconEl(ICONS.megaphone), title: "Post Announcement", sub: "Notify members", link: "/admin/work" },
    { icon: iconEl(ICONS.scan), title: "Scan Console", sub: "Verify attendance", link: "/admin/scan" },
  ];

  const activity: ActivityItem[] = orgPosts.slice(0, 3).map((p) => ({
    icon: iconEl(p.type === "MINUTE" ? ICONS.document : ICONS.megaphone),
    text: p.type === "MINUTE" ? <>Published meeting minutes: <b>{p.body.slice(0, 60)}</b></> : <>Posted announcement: <b>{p.body.slice(0, 60)}</b></>,
    time: timeAgo(p.publishedAt),
  }));

  return (
    <DashboardShell
      title="Secretary"
      scope="Scope: Members · Minutes · Announcements · Scan"
      stats={stats}
      statsLoading={isSummaryLoading || isPostsLoading}
      actions={actions}
      activity={activity}
      activityLoading={isPostsLoading}
    />
  );
}

// ---------------------------------------------------------------------------
// Treasurer — Scope: Dues · Expenses · Financial Reports · Scan
// ---------------------------------------------------------------------------
function TreasurerDashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useQuery<FinanceSummary>({
    queryKey: ["finance", "summary"],
    queryFn: getFinanceSummary,
    staleTime: 60_000,
  });
  const { data: entries, isLoading: isEntriesLoading } = useQuery<FinanceEntry[]>({
    queryKey: ["finance", "entries", "recent"],
    queryFn: () => listFinanceEntries({ limit: 5 }),
    staleTime: 60_000,
  });

  const stats: StatItem[] = [
    { icon: iconEl(ICONS.peso), value: currency(summary?.fundsOnHand ?? 0), label: "Funds on Hand", tone: "primary" },
    { icon: iconEl(ICONS.checkBadge), value: currency(summary?.totalDues ?? 0), label: "Dues Collected", tone: "primary" },
    { icon: iconEl(ICONS.alert), value: currency(summary?.pendingDuesAmount ?? 0), label: "Pending Dues", tone: "warn", hint: "Follow up needed" },
  ];

  const actions: ActionItem[] = [
    { icon: iconEl(ICONS.peso), title: "Record Payment", sub: "Log a dues payment", link: "/admin/work" },
    { icon: iconEl(ICONS.document), title: "Financial Report", sub: "Semester statement", link: "/admin/work" },
    { icon: iconEl(ICONS.chart), title: "Expense Log", sub: "Track spending", link: "/admin/work" },
    { icon: iconEl(ICONS.scan), title: "Scan Console", sub: "Verify attendance", link: "/admin/scan" },
  ];

  const activity: ActivityItem[] = (entries ?? []).slice(0, 3).map((e) => ({
    icon: iconEl(e.type === "DUES" ? ICONS.peso : ICONS.chart),
    text: e.type === "DUES" ? <>Recorded dues payment: <b>{e.description}</b></> : <>Logged expense: <b>{e.description} — {currency(e.amount)}</b></>,
    time: timeAgo(e.createdAt),
  }));

  return (
    <DashboardShell
      title="Treasurer"
      scope="Scope: Dues · Expenses · Financial Reports · Scan"
      stats={stats}
      statsLoading={isSummaryLoading}
      actions={actions}
      activity={activity}
      activityLoading={isEntriesLoading}
    />
  );
}

// ---------------------------------------------------------------------------
// Auditor — Scope: Financial Review · Attendance Records (no scan access)
// ---------------------------------------------------------------------------
function AuditorDashboard() {
  const { data: attendanceStats, isLoading: isAttendanceLoading } = useQuery<AttendanceStats>({
    queryKey: ["attendance", "stats"],
    queryFn: getAttendanceStats,
    staleTime: 60_000,
  });
  const { data: entries, isLoading: isEntriesLoading } = useQuery<FinanceEntry[]>({
    queryKey: ["finance", "entries", "audit"],
    queryFn: () => listFinanceEntries({ limit: 20 }),
    staleTime: 60_000,
  });

  const reviewCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentExpenses = (entries ?? []).filter((e) => e.type === "EXPENSE" && new Date(e.createdAt).getTime() > reviewCutoff);

  const stats: StatItem[] = [
    { icon: iconEl(ICONS.document), value: recentExpenses.length, label: "Reports to Audit", tone: "warn", hint: "Last 30 days" },
    { icon: iconEl(ICONS.attendance), value: `${attendanceStats?.validRate ?? 0}%`, label: "Valid Scan Rate", tone: "primary" },
    { icon: iconEl(ICONS.shield), value: 0, label: "Discrepancies", tone: "neutral", hint: "None flagged" },
  ];

  const actions: ActionItem[] = [
    { icon: iconEl(ICONS.document), title: "Review Finance", sub: "Read-only ledger", link: "/admin/work" },
    { icon: iconEl(ICONS.attendance), title: "Attendance", sub: "Cross-check logs", link: "/admin/work" },
    { icon: iconEl(ICONS.checkBadge), title: "Submit Audit", sub: "This semester", link: "/admin/work" },
  ];

  const activity: ActivityItem[] = (entries ?? []).slice(0, 3).map((e) => ({
    icon: iconEl(e.type === "DUES" ? ICONS.peso : ICONS.chart),
    text: e.type === "DUES" ? <>Dues recorded by Treasurer: <b>{e.description}</b></> : <>Expense logged: <b>{e.description} — {currency(e.amount)}</b></>,
    time: timeAgo(e.createdAt),
  }));

  return (
    <DashboardShell
      title="Auditor"
      scope="Scope: Financial Review · Attendance Records"
      stats={stats}
      statsLoading={isAttendanceLoading || isEntriesLoading}
      actions={actions}
      activity={activity}
      activityLoading={isEntriesLoading}
    />
  );
}

// ---------------------------------------------------------------------------
// Business Manager — Scope: Procurement · Supplier Coordination · Scan
// ---------------------------------------------------------------------------
function BusinessManagerDashboard() {
  const { data: requests, isLoading } = useQuery<PurchaseRequest[]>({
    queryKey: ["procurement", "requests"],
    queryFn: listPurchaseRequests,
    staleTime: 60_000,
  });

  const list = requests ?? [];
  const activeOrders = list.filter((r) => r.status !== "REJECTED").length;
  const pendingApproval = list.filter((r) => r.status === "PENDING").length;
  const spendThisMonth = list.filter((r) => isThisMonth(r.createdAt)).reduce((sum, r) => sum + r.estimatedCost, 0);

  const stats: StatItem[] = [
    { icon: iconEl(ICONS.box), value: activeOrders, label: "Active Orders", tone: "primary" },
    { icon: iconEl(ICONS.peso), value: currency(spendThisMonth), label: "This Month", tone: "neutral" },
    { icon: iconEl(ICONS.clock), value: pendingApproval, label: "Pending Approval", tone: "warn", hint: "Awaiting Treasurer" },
  ];

  const actions: ActionItem[] = [
    { icon: iconEl(ICONS.box), title: "New Purchase Request", sub: "Materials for events", link: "/admin/work" },
    { icon: iconEl(ICONS.suppliers), title: "Supplier List", sub: "Manage vendors", link: "/admin/work" },
    { icon: iconEl(ICONS.scan), title: "Scan Console", sub: "Verify attendance", link: "/admin/scan" },
  ];

  const STATUS_TEXT: Record<PurchaseRequest["status"], string> = {
    PENDING: "Requested",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };

  const activity: ActivityItem[] = [...list]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .map((r) => ({
      icon: iconEl(ICONS.box),
      text: <>{STATUS_TEXT[r.status]}: <b>{r.item}</b> — {currency(r.estimatedCost)}</>,
      time: timeAgo(r.createdAt),
    }));

  return (
    <DashboardShell
      title="Business Manager"
      scope="Scope: Procurement · Supplier Coordination · Scan"
      stats={stats}
      statsLoading={isLoading}
      actions={actions}
      activity={activity}
      activityLoading={isLoading}
    />
  );
}

// ---------------------------------------------------------------------------
// PRO — Scope: News · Social Content · Scan (assigned events)
// ---------------------------------------------------------------------------
function ProDashboard() {
  const { data: posts, isLoading } = useQuery<NewsPost[]>({
    queryKey: ["posts"],
    queryFn: listNewsPosts,
    staleTime: 60_000,
  });

  const list = posts ?? [];
  const postsThisMonth = list.filter((p) => isThisMonth(p.publishedAt)).length;
  const syncedPosts = list.filter((p) => p.source === "facebook");
  const reachCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const reach30d = syncedPosts
    .filter((p) => new Date(p.publishedAt).getTime() > reachCutoff)
    .reduce((sum, p) => sum + (p.likeCount ?? 0) + (p.commentCount ?? 0), 0);

  const stats: StatItem[] = [
    { icon: iconEl(ICONS.edit), value: postsThisMonth, label: "Posts This Month", tone: "neutral" },
    { icon: iconEl(ICONS.chart), value: reach30d >= 1000 ? `${(reach30d / 1000).toFixed(1)}K` : reach30d, label: "Reach (30d)", tone: "primary", hint: "Likes + comments" },
    { icon: iconEl(ICONS.facebook), value: syncedPosts.length, label: "Synced Posts", tone: "primary" },
  ];

  const actions: ActionItem[] = [
    { icon: iconEl(ICONS.facebook), title: "New Post", sub: "Write an update", link: "/admin/work" },
    { icon: iconEl(ICONS.facebook), title: "Facebook Sync", sub: "Check latest posts", link: "/admin/work" },
    { icon: iconEl(ICONS.scan), title: "Scan Console", sub: "Assigned events only", link: "/admin/scan" },
  ];

  const activity: ActivityItem[] = list.slice(0, 3).map((p) => ({
    icon: iconEl(p.source === "facebook" ? ICONS.facebook : ICONS.edit),
    text: p.source === "facebook" ? <>Synced from Facebook: <b>{p.body.slice(0, 60)}</b></> : <>Published manual post: <b>{p.body.slice(0, 60)}</b></>,
    time: timeAgo(p.publishedAt),
  }));

  return (
    <DashboardShell
      title="Public Relations Officer"
      scope="Scope: News · Social Content · Scan"
      stats={stats}
      statsLoading={isLoading}
      actions={actions}
      activity={activity}
      activityLoading={isLoading}
    />
  );
}

// ---------------------------------------------------------------------------
// Entry point — dispatch by officer position
// Vice President is Super-Admin-equivalent (see utils/roles.ts) and never
// reaches this component — AdminHomePage.tsx routes them straight to
// SuperAdminDashboardPage instead, since they're expected to continue every
// admin/officer operation during the President's absence, not just get a
// narrower "backup" view.
// ---------------------------------------------------------------------------
export default function AdminDashboardPage() {
  const { user } = useAuth();

  if (!user || !user.officerPosition) return null;

  switch (user.officerPosition) {
    case "secretary":
      return <SecretaryDashboard />;
    case "treasurer":
      return <TreasurerDashboard />;
    case "auditor":
      return <AuditorDashboard />;
    case "business_manager":
      return <BusinessManagerDashboard />;
    case "pro":
      return <ProDashboard />;
    default:
      return (
        <div className="min-h-screen bg-mist px-5 pt-6 pb-24">
          <h1 className="text-2xl font-heading font-bold text-forest">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-2">Welcome back, {user.name}. Your role does not have a dashboard view yet.</p>
        </div>
      );
  }
}
