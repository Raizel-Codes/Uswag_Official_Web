// Audit Log
// SUPER ADMIN ONLY (Auditor gets a scoped read view via Finance Overview / Scan records instead).
// ACCESS: RoleRoute allow={['super_admin']} in AppRoutes.tsx redirects non-super-admin to "/".
//         requireRole('SUPER_ADMIN') in audit.routes.ts is the server enforcement boundary.

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listAuditLog, type AuditLogEntry } from "@/services/adminService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const ACTION_ICONS: Record<string, JSX.Element> = {
  "member.approve": (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 stroke-primary">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  ),
  "member.reject": (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 stroke-red-400">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
    </svg>
  ),
  "officer.assign": (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 stroke-primary">
      <path d="M12 2l2.9 6.26L21 9l-5 4.6L17.8 21 12 17.5 6.2 21 7 13.6 2 9l6.1-.74z" />
    </svg>
  ),
  "finance.dues": (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 stroke-primary">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  "finance.expense": (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 stroke-primary">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  "bylaws.propose_amendment": (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 stroke-primary">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
};

function getIcon(action: string): JSX.Element {
  // Find a prefix match
  for (const key of Object.keys(ACTION_ICONS)) {
    if (action.startsWith(key)) return ACTION_ICONS[key];
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 stroke-gray-400">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

const ACTION_BADGE: Record<string, string> = {
  "member.approve": "bg-successBg text-success",
  "member.reject": "bg-red-50 text-red-500",
  "officer.assign": "bg-mist text-primary",
  "finance.dues": "bg-mist text-primary",
  "finance.expense": "bg-gray-100 text-gray-600",
  "bylaws.propose_amendment": "bg-amber-50 text-amber-600",
  "bylaws.approved": "bg-successBg text-success",
  "bylaws.rejected": "bg-red-50 text-red-500",
};

function getBadgeCls(action: string): string {
  for (const key of Object.keys(ACTION_BADGE)) {
    if (action.startsWith(key)) return ACTION_BADGE[key];
  }
  return "bg-gray-100 text-gray-500";
}

function humanAction(action: string): string {
  return action
    .replace("member.approve", "Member Approved")
    .replace("member.reject", "Member Rejected")
    .replace("officer.assign", "Officer Assigned")
    .replace("finance.dues", "Dues Recorded")
    .replace("finance.expense", "Expense Logged")
    .replace("bylaws.propose_amendment", "Amendment Proposed")
    .replace("bylaws.approved", "Amendment Approved")
    .replace("bylaws.rejected", "Amendment Rejected")
    .replace(/\./g, " · ");
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Audit entry row
// ---------------------------------------------------------------------------
function AuditRow({ entry }: { entry: AuditLogEntry }) {
  const actorName = entry.actor?.name ?? entry.actorId.slice(0, 8) + "…";

  return (
    <tr className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
      {/* Time */}
      <td className="px-5 py-3.5 text-[11.5px] text-gray-400 whitespace-nowrap font-mono">
        {formatDateTime(entry.createdAt)}
      </td>

      {/* Actor */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-mist flex items-center justify-center font-heading font-bold text-[10px] text-primary shrink-0">
            {initials(actorName)}
          </div>
          <div>
            <div className="text-[12.5px] font-bold text-forest">{actorName}</div>
          </div>
        </div>
      </td>

      {/* Action */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1.5">
          <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${getBadgeCls(entry.action)}`}>
            {getIcon(entry.action)}
            {humanAction(entry.action)}
          </span>
        </div>
      </td>

      {/* Target */}
      <td className="px-5 py-3.5 text-[12px] text-gray-500">
        {entry.targetType && (
          <span>
            <span className="font-semibold text-forest">{entry.targetType}</span>
            {entry.targetId && (
              <span className="ml-1 font-mono text-[10.5px] text-gray-400">
                {entry.targetId.slice(0, 8)}…
              </span>
            )}
          </span>
        )}
      </td>

      {/* Metadata preview */}
      <td className="px-5 py-3.5 text-[11px] text-gray-400 max-w-[200px] truncate">
        {entry.metadata
          ? Object.entries(entry.metadata)
              .slice(0, 2)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(" · ")
          : "—"}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Filter chip
// ---------------------------------------------------------------------------
function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "px-3.5 py-1.5 rounded-full text-[12px] font-semibold border transition-colors " +
        (active
          ? "bg-primary text-white border-primary"
          : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50")
      }
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const ACTION_FILTERS = [
  { label: "All", value: "" },
  { label: "Members", value: "member" },
  { label: "Finance", value: "finance" },
  { label: "Officers", value: "officer" },
  { label: "Bylaws", value: "bylaws" },
];

export default function AuditLogPage() {
  // Non-super-admin users are NEVER rendered here — RoleRoute redirects to "/".
  const [activeFilter, setActiveFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data: entries, isLoading, error } = useQuery<AuditLogEntry[]>({
    queryKey: ["audit-log", activeFilter],
    queryFn: () => listAuditLog(),
    staleTime: 30_000,
  });

  // Client-side search filter (the backend filter is by action prefix)
  const filtered = (entries ?? []).filter((e) => {
    const matchesFilter = !activeFilter || e.action.startsWith(activeFilter);
    const matchesSearch =
      !search ||
      (e.actor?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      (e.targetType ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-mist pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[22px] font-bold text-forest">Audit Log</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Full system action history — accountability trail
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-amber-50 text-amber-600 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 stroke-amber-500">
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Super Admin Only
          </span>
        </div>
      </div>

      <div className="px-6 py-5">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-600">
            Failed to load audit log: {error instanceof Error ? error.message : "Unknown error"}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="font-heading text-[22px] font-extrabold text-forest">
              {isLoading ? "…" : (entries?.length ?? 0)}
            </div>
            <div className="text-[11px] text-gray-500 font-semibold mt-0.5">Total Actions</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="font-heading text-[22px] font-extrabold text-primary">
              {isLoading
                ? "…"
                : (entries ?? []).filter((e) => {
                    const d = new Date(e.createdAt);
                    const now = new Date();
                    return d.toDateString() === now.toDateString();
                  }).length}
            </div>
            <div className="text-[11px] text-gray-500 font-semibold mt-0.5">Today</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="font-heading text-[22px] font-extrabold text-amber-500">
              {isLoading
                ? "…"
                : new Set((entries ?? []).map((e) => e.actorId)).size}
            </div>
            <div className="text-[11px] text-gray-500 font-semibold mt-0.5">Unique Actors</div>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex gap-2">
            {ACTION_FILTERS.map((f) => (
              <Chip
                key={f.value}
                label={f.label}
                active={activeFilter === f.value}
                onClick={() => setActiveFilter(f.value)}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1 max-w-xs ml-auto">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-gray-400 shrink-0">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="input-audit-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by actor or action..."
              className="flex-1 bg-transparent text-[13px] text-forest outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-heading font-bold text-[14.5px] text-forest">Action History</h3>
            {!isLoading && (
              <span className="text-[11px] font-semibold text-gray-400">
                {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="h-12 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[13px] text-gray-500">No audit log entries match your filter.</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Actions on members, finances, officers, and bylaws are logged automatically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3 whitespace-nowrap">
                      Timestamp
                    </th>
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">
                      Actor
                    </th>
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">
                      Action
                    </th>
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">
                      Target
                    </th>
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <AuditRow key={e.id} entry={e} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
