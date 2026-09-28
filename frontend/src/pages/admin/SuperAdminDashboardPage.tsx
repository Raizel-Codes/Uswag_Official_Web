// Super Admin Dashboard — desktop-first, per claude.md ("Super Admin is
// desktop-first" vs. Officer Admin's mobile-first AdminDashboardPage).
// Matches prototype/super-admin.html's #view-dashboard: stat-grid, a
// two-column (applications table + activity feed) panel row, and an
// upcoming-events table. Every number here is fetched, not hardcoded.

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getFinanceSummary } from "@/services/financeService";
import { listEvents } from "@/services/eventService";
import { getAttendanceStats } from "@/services/attendanceService";
import { listMembers, approveApplication, rejectApplication } from "@/services/memberService";
import { listAuditLog, type AuditLogEntry } from "@/services/adminService";
import { ForbiddenError } from "@/services/api";
import type { FinanceSummary } from "@/types/finance.types";
import type { UswagEvent, AttendanceStats } from "@/types/event.types";
import type { MemberProfile } from "@/types/member.types";
import { PILLAR_LABELS, STATUS_LABELS } from "@/types/event.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
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

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-successBg text-success",
  pending: "bg-amber-50 text-amber-600",
  expired: "bg-gray-100 text-gray-500",
  rejected: "bg-red-50 text-red-500",
};

const EVENT_STATUS_BADGE: Record<string, string> = {
  CONFIRMED: "bg-successBg text-success",
  DRAFT: "bg-amber-50 text-amber-600",
  COMPLETED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-50 text-red-500",
};

const AUDIT_ACTION_ICON: Record<string, JSX.Element> = {
  scan: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
  ),
  "member.approve": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
  ),
  "member.reject": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
  ),
  "officer.assign": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.9 6.26L21 9l-5 4.6L17.8 21 12 17.5 6.2 21 7 13.6 2 9l6.1-.74z" /></svg>
  ),
  "bylaws.propose_amendment": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
  ),
};

function auditIcon(action: string) {
  const key = Object.keys(AUDIT_ACTION_ICON).find((k) => action.startsWith(k));
  return key ? AUDIT_ACTION_ICON[key] : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
  );
}

function auditSummary(entry: AuditLogEntry): string {
  const actor = entry.actor?.name ?? "Someone";
  switch (true) {
    case entry.action.startsWith("member.approve"):
      return `${actor} approved a membership application`;
    case entry.action.startsWith("member.reject"):
      return `${actor} rejected a membership application`;
    case entry.action.startsWith("officer.assign"):
      return `${actor} reassigned an officer position`;
    case entry.action.startsWith("finance.dues"):
      return `${actor} recorded a dues payment`;
    case entry.action.startsWith("finance.expense"):
      return `${actor} logged an expense`;
    case entry.action.startsWith("bylaws.propose_amendment"):
      return `${actor} proposed a bylaws amendment`;
    case entry.action.startsWith("bylaws"):
      return `${actor} updated a bylaws amendment`;
    default:
      return `${actor} performed ${entry.action}`;
  }
}

// ---------------------------------------------------------------------------
// Stat card — desktop variant (icon chip left, value + label right) per
// prototype's .stat-card. KpiCard stays mobile-first; this mirrors its
// tone system so the two look like one design language at different widths.
// ---------------------------------------------------------------------------
function StatCard({ icon, value, label }: { icon: JSX.Element; value: React.ReactNode; label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="w-9 h-9 rounded-lg bg-mist flex items-center justify-center mb-3">
        <span className="w-4 h-4 stroke-primary [&>svg]:w-full [&>svg]:h-full">{icon}</span>
      </div>
      <div className="font-heading text-[26px] font-extrabold text-forest leading-none">{value}</div>
      <div className="text-[12px] text-gray-500 mt-1.5 font-medium">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function SuperAdminDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

  function flashToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const { data: summary, isLoading: isSummaryLoading } = useQuery<FinanceSummary>({
    queryKey: ["finance", "summary"],
    queryFn: getFinanceSummary,
    staleTime: 60_000,
  });

  const { data: events, isLoading: isEventsLoading } = useQuery<UswagEvent[]>({
    queryKey: ["events"],
    queryFn: listEvents,
    staleTime: 60_000,
  });

  const { data: attendanceStats, isLoading: isAttendanceLoading } = useQuery<AttendanceStats>({
    queryKey: ["attendance", "stats"],
    queryFn: getAttendanceStats,
    staleTime: 60_000,
  });

  const { data: recentMembers, isLoading: isMembersLoading } = useQuery<MemberProfile[]>({
    queryKey: ["members", "recent"],
    queryFn: () => listMembers(),
    staleTime: 30_000,
  });

  const { data: auditLog, isLoading: isAuditLoading } = useQuery<AuditLogEntry[]>({
    queryKey: ["audit-log", "recent"],
    queryFn: listAuditLog,
    staleTime: 60_000,
  });

  const approveMutation = useMutation({
    mutationFn: (memberId: string) => approveApplication(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      flashToast("Application approved ✓");
    },
    onError: (err: unknown) => {
      flashToast(err instanceof ForbiddenError ? "Permission denied" : "Failed to approve");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (memberId: string) => rejectApplication(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      flashToast("Application rejected");
    },
    onError: (err: unknown) => {
      flashToast(err instanceof ForbiddenError ? "Permission denied" : "Failed to reject");
    },
  });

  // Derived stats
  const now = new Date();
  const eventsThisMonth = (events ?? []).filter((e) => {
    const d = new Date(e.startsAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const upcomingEvents = (events ?? [])
    .filter((e) => new Date(e.startsAt) >= now && e.status !== "CANCELLED")
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 5);

  const recentApplications = (recentMembers ?? []).slice(0, 5);
  const recentActivity = (auditLog ?? []).slice(0, 5);

  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-mist px-6 md:px-8 py-6 pb-16">
      {/* Topbar */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-[22px] font-bold text-forest">
            {greeting}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <div className="text-[13px] text-gray-500 mt-1">
            Here&apos;s what&apos;s happening in USWAG today ·{" "}
            {now.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
          </div>
        </div>
        <Link
          to="/admin/events"
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 py-2.5 text-[13px] font-bold shadow-sm hover:bg-primary/90 transition-colors shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Event
        </Link>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isSummaryLoading || isEventsLoading || isAttendanceLoading ? (
          [1, 2, 3, 4].map((n) => <div key={n} className="h-[112px] rounded-2xl bg-gray-100 animate-pulse" />)
        ) : (
          <>
            <StatCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>}
              value={summary?.activeMembers ?? 0}
              label="Active Members"
            />
            <StatCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
              value={eventsThisMonth}
              label="Events This Month"
            />
            <StatCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
              value={`${attendanceStats?.validRate ?? 0}%`}
              label="Valid Scan Rate"
            />
            <StatCard
              icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>}
              value={summary?.pendingApplications ?? 0}
              label="Pending Applications"
            />
          </>
        )}
      </div>

      {/* Applications + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 mb-6 items-start">
        {/* Recent applications */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-heading font-bold text-[14.5px] text-forest">Recent Membership Applications</h3>
            <Link to="/admin/members" className="text-[12px] font-bold text-primary hover:underline">View all</Link>
          </div>
          {isMembersLoading ? (
            <div className="p-5 space-y-2.5">
              {[1, 2, 3].map((n) => <div key={n} className="h-12 rounded-xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : recentApplications.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-500">No applications yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">Applicant</th>
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">College/Dept</th>
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">Submitted</th>
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentApplications.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-mist flex items-center justify-center font-heading font-bold text-[11px] text-primary shrink-0">
                            {initials(m.name || "?")}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-bold text-forest truncate">{m.name || "Unnamed"}</div>
                            <div className="text-[11px] text-gray-500 truncate">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[12.5px] text-gray-600">{m.collegeOrDept}</td>
                      <td className="px-5 py-3 text-[12px] text-gray-500">{timeAgo(m.joinedAt)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[m.status] ?? "bg-gray-100 text-gray-500"}`}>
                          {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {m.status === "pending" && (
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => approveMutation.mutate(m.id)}
                              disabled={approveMutation.isPending}
                              title="Approve"
                              className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-successBg hover:border-success transition-colors"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 stroke-success"><polyline points="20 6 9 17 4 12" /></svg>
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(m.id)}
                              disabled={rejectMutation.isPending}
                              title="Reject"
                              className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-colors"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 stroke-red-500"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-heading font-bold text-[14.5px] text-forest">Recent Activity</h3>
          </div>
          {isAuditLoading ? (
            <div className="p-5 space-y-2.5">
              {[1, 2, 3].map((n) => <div key={n} className="h-10 rounded-xl bg-gray-100 animate-pulse" />)}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-gray-500">No activity recorded yet.</div>
          ) : (
            <div>
              {recentActivity.map((entry) => (
                <div key={entry.id} className="flex gap-3 px-5 py-3.5 border-b border-gray-100 last:border-b-0">
                  <div className="w-8 h-8 rounded-lg bg-mist flex items-center justify-center shrink-0">
                    <span className="w-3.5 h-3.5 stroke-primary [&>svg]:w-full [&>svg]:h-full">{auditIcon(entry.action)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12.5px] text-forest leading-snug">{auditSummary(entry)}</p>
                    <span className="text-[11px] text-gray-500">{timeAgo(entry.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming events */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-heading font-bold text-[14.5px] text-forest">Upcoming Events</h3>
          <Link to="/admin/events" className="text-[12px] font-bold text-primary hover:underline">Manage events</Link>
        </div>
        {isEventsLoading ? (
          <div className="p-5 space-y-2.5">
            {[1, 2].map((n) => <div key={n} className="h-10 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-gray-500">No upcoming events scheduled.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">Event</th>
                  <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">Pillar</th>
                  <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">Date</th>
                  <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">RSVPs</th>
                  <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {upcomingEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-[13px] font-bold text-forest">{e.title}</td>
                    <td className="px-5 py-3 text-[12.5px] text-gray-600">{PILLAR_LABELS[e.pillar]}</td>
                    <td className="px-5 py-3 text-[12.5px] text-gray-600">{formatEventDate(e.startsAt)}</td>
                    <td className="px-5 py-3 text-[12.5px] text-gray-600">
                      {e._count?.rsvps ?? 0} {e.limitedSlots ? "applied" : "going"}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${EVENT_STATUS_BADGE[e.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {STATUS_LABELS[e.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 bg-forest text-white px-5 py-3 rounded-xl shadow-xl font-medium text-sm flex items-center gap-3 z-50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-[#7ee6a8]">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}
