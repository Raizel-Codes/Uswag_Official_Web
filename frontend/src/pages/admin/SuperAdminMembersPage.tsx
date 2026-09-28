// Members — Super Admin desktop view.
// Matches prototype/super-admin.html's #view-members: search bar, status
// chips, and a full roster table with attendance% and inline actions.
// Officer Admin (Secretary) gets the mobile-first MemberManagementPage
// instead — see AdminMembersHomePage.tsx for the role dispatch.

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listMembers, approveApplication, rejectApplication } from "@/services/memberService";
import { ForbiddenError } from "@/services/api";
import type { MemberProfile, MembershipStatus } from "@/types/member.types";

function initials(name: string) {
  return (name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

const STATUS_BADGE: Record<MembershipStatus, string> = {
  active: "bg-successBg text-success",
  pending: "bg-amber-50 text-amber-600",
  expired: "bg-gray-100 text-gray-500",
  rejected: "bg-red-50 text-red-500",
};

type ChipFilter = "all" | MembershipStatus;

export default function SuperAdminMembersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ChipFilter>("all");
  const [toast, setToast] = useState<string | null>(null);
  const queryClient = useQueryClient();

  function flashToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const { data: members, isLoading, error } = useQuery<MemberProfile[]>({
    queryKey: ["members", "all"],
    queryFn: () => listMembers(),
    staleTime: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: (memberId: string) => approveApplication(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      flashToast("Application approved ✓");
    },
    onError: (err: unknown) =>
      flashToast(err instanceof ForbiddenError ? "Permission denied" : "Failed to approve"),
  });

  const rejectMutation = useMutation({
    mutationFn: (memberId: string) => rejectApplication(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      flashToast("Application rejected");
    },
    onError: (err: unknown) =>
      flashToast(err instanceof ForbiddenError ? "Permission denied" : "Failed to reject"),
  });

  const list = members ?? [];

  const counts = useMemo(() => {
    return {
      all: list.length,
      active: list.filter((m) => m.status === "active").length,
      pending: list.filter((m) => m.status === "pending").length,
      expired: list.filter((m) => m.status === "expired").length,
      rejected: list.filter((m) => m.status === "rejected").length,
    };
  }, [list]);

  const filtered = list.filter((m) => {
    if (filter !== "all" && m.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.serialNumber?.toLowerCase().includes(q);
    }
    return true;
  });

  const CHIPS: { key: ChipFilter; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "active", label: `Active (${counts.active})` },
    { key: "pending", label: `Pending (${counts.pending})` },
    { key: "expired", label: `Expired (${counts.expired})` },
    { key: "rejected", label: `Rejected (${counts.rejected})` },
  ];

  return (
    <div className="min-h-screen bg-mist px-6 md:px-8 py-6 pb-16">
      {/* Topbar */}
      <div className="mb-6">
        <h1 className="font-heading text-[22px] font-bold text-forest">Members</h1>
        <div className="text-[13px] text-gray-500 mt-1">
          {counts.active} active · {counts.pending} pending application{counts.pending === 1 ? "" : "s"}
        </div>
      </div>

      {/* Search + filter chips */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 max-w-[340px] shadow-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-gray-400 shrink-0">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members by name or ID..."
            className="border-none outline-none text-[13px] w-full bg-transparent text-forest"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CHIPS.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
                filter === chip.key
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-600">
          Failed to load members: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-2.5">
            {[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-12 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-[13px] text-gray-500">
            {search.trim() ? "No members match your search." : "No members in this category yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">Member</th>
                  <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">Serial No.</th>
                  <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">College/Dept</th>
                  <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">Attendance</th>
                  <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-mist flex items-center justify-center font-heading font-bold text-[11.5px] text-primary shrink-0">
                          {initials(m.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-bold text-forest truncate">{m.name || "Unnamed"}</div>
                          <div className="text-[11px] text-gray-500 truncate">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[12.5px] text-gray-600 font-mono">{m.serialNumber || "—"}</td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-600">{m.collegeOrDept}</td>
                    <td className="px-5 py-3.5 text-[13px] text-gray-600">
                      {m.status === "active" ? `${m.attendanceRate}%` : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[m.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5 justify-end">
                        {m.status === "pending" ? (
                          <>
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
                          </>
                        ) : m.status === "active" ? (
                          <Link
                            to="/admin/scan"
                            title="Scan console"
                            className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-mist transition-colors"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 stroke-forest"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                          </Link>
                        ) : null}
                      </div>
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
