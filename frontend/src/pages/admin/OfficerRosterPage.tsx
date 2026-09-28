// Officer Roster & Transitions
// SUPER ADMIN ONLY — manage current term + archive past terms per Article VI §4.
// ACCESS: enforced at route level via RoleRoute allow={['super_admin']} in AppRoutes.tsx
//          AND requireRole('SUPER_ADMIN') in officer.routes.ts.
// Non-super-admin users are redirected to "/" by RoleRoute — they never reach this component.

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listOfficers,
  assignOfficer,
  type OfficerUser,
} from "@/services/adminService";
import OfficerAvatar from "@/components/common/OfficerAvatar";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const POSITION_LABELS: Record<string, string> = {
  PRESIDENT: "President",
  VICE_PRESIDENT: "Vice President",
  SECRETARY: "Secretary",
  TREASURER: "Treasurer",
  AUDITOR: "Auditor",
  BUSINESS_MANAGER: "Business Manager",
  PRO: "PRO",
};

const POSITION_ORDER = [
  "PRESIDENT",
  "VICE_PRESIDENT",
  "SECRETARY",
  "TREASURER",
  "AUDITOR",
  "BUSINESS_MANAGER",
  "PRO",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Officer card — matches prototype .officer-card / .officer-photo
// ---------------------------------------------------------------------------
function OfficerCard({ officer }: { officer: OfficerUser }) {
  const pos = officer.officerPosition ?? "—";
  const label = POSITION_LABELS[pos] ?? pos;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center hover:shadow-md transition-shadow">
      <div className="relative w-16 h-16 mx-auto mb-2.5">
        {/* Placeholder illustration until a real officer photo is uploaded */}
        <OfficerAvatar seed={officer.id} className="w-16 h-16 rounded-2xl bg-mist" />
        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[8.5px] font-heading font-bold flex items-center justify-center border-2 border-white">
          {initials(officer.name)}
        </span>
      </div>
      <h4 className="font-heading font-bold text-[13.5px] text-forest">{officer.name}</h4>
      <div className="text-[11px] font-bold text-primary mt-0.5">{label}</div>
      <div className="text-[10.5px] text-gray-500 mt-1.5 leading-snug">{officer.collegeOrDept}</div>
      <div className="mt-2 text-[10px] text-gray-400 font-mono truncate">{officer.email}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assign Officer form (bottom sheet-style panel)
// ---------------------------------------------------------------------------
function AssignOfficerPanel({
  officers,
  onSuccess,
}: {
  officers: OfficerUser[];
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({ userId: "", officerPosition: "" });
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      assignOfficer({ userId: form.userId, officerPosition: form.officerPosition }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["officers"] });
      setForm({ userId: "", officerPosition: "" });
      setError(null);
      onSuccess();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to assign officer");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.userId) return setError("Select a member to assign.");
    if (!form.officerPosition) return setError("Select a position.");
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-heading font-bold text-[14.5px] text-forest mb-4">Assign Officer</h3>
      <div className="mb-3">
        <label className="block text-[11.5px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
          Member
        </label>
        <select
          id="select-assign-member"
          value={form.userId}
          onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13px] text-forest outline-none focus:ring-2 focus:ring-primary/25"
        >
          <option value="">— Select officer to reassign —</option>
          {officers.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} ({o.email})
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-[11.5px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
          Position
        </label>
        <select
          id="select-assign-position"
          value={form.officerPosition}
          onChange={(e) => setForm((f) => ({ ...f, officerPosition: e.target.value }))}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13px] text-forest outline-none focus:ring-2 focus:ring-primary/25"
        >
          <option value="">— Select position —</option>
          {POSITION_ORDER.map((p) => (
            <option key={p} value={p}>
              {POSITION_LABELS[p]}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mb-3 text-[11.5px] text-red-500 font-medium">{error}</p>}
      <button
        id="btn-assign-officer"
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-xl bg-primary py-2.5 text-[13px] font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {mutation.isPending ? "Assigning…" : "Assign Officer"}
      </button>
      <p className="mt-2 text-[10.5px] text-gray-400 text-center">
        Article VI §4 — changes are logged to the audit trail
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  function show(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(null), 3000);
  }
  return { msg, show };
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function OfficerRosterPage() {
  // Non-super-admin users are NEVER rendered here —
  // RoleRoute in AppRoutes.tsx redirects them to "/" before mounting.
  // The requireRole('SUPER_ADMIN') in officer.routes.ts is the actual
  // security boundary; this component is a UX layer only.

  const { msg: toastMsg, show: showToast } = useToast();

  const { data: officers, isLoading, error } = useQuery<OfficerUser[]>({
    queryKey: ["officers"],
    queryFn: listOfficers,
    staleTime: 60_000,
  });

  const officerList = officers ?? [];

  // Sort by the canonical position order
  const sorted = [...officerList].sort((a, b) => {
    const ai = POSITION_ORDER.indexOf(a.officerPosition ?? "");
    const bi = POSITION_ORDER.indexOf(b.officerPosition ?? "");
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="min-h-screen bg-mist pb-10">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[22px] font-bold text-forest">Officers</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            A.Y. 2026–2027 · Term managed per Article VI
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

      <div className="px-6 py-6">
        {/* Error state */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-600">
            Failed to load officers: {error instanceof Error ? error.message : "Unknown error"}
          </div>
        )}

        {/* Officer grid — matches prototype .officer-grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-[14.5px] text-forest">
              Current Term Officers
            </h3>
            <span className="text-[11px] font-semibold text-primary">
              {isLoading ? "…" : `${officerList.length} officers`}
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <div key={n} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="rounded-2xl bg-white border border-gray-100 p-8 text-center shadow-sm">
              <p className="text-[13px] text-gray-500">No officers assigned for this term yet.</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Use the Assign Officer form below to add officers.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {sorted.map((o) => (
                <OfficerCard key={o.id} officer={o} />
              ))}
            </div>
          )}
        </div>

        {/* Two-column layout: assign form + past terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Assign Officer form */}
          <AssignOfficerPanel
            officers={officerList}
            onSuccess={() => showToast("Officer assigned successfully ✓")}
          />

          {/* Past terms archive — matches prototype "Past Officer Terms (Legacy Archive)" */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-heading font-bold text-[14.5px] text-forest">
                Past Officer Terms
              </h3>
              <span className="text-[11px] font-semibold text-gray-400">Legacy Archive</span>
            </div>
            <div className="divide-y divide-gray-100">
              {[
                { term: "A.Y. 2025–2026", president: "Katherine Bautista", members: 412 },
                { term: "A.Y. 2024–2025", president: "Bryan Ocampo", members: 358 },
                { term: "A.Y. 2023–2024", president: "Rhea Santos", members: 291 },
              ].map((row) => (
                <div key={row.term} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="text-[13px] font-semibold text-forest">{row.term}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      President: {row.president} · {row.members} members at term end
                    </div>
                  </div>
                  <span className="text-[11.5px] font-bold text-primary hover:underline cursor-pointer shrink-0 ml-4">
                    View archive
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Officers table — more detailed view for Super Admin */}
        {!isLoading && sorted.length > 0 && (
          <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-heading font-bold text-[14.5px] text-forest">
                Officer Details
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">
                      Officer
                    </th>
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">
                      Position
                    </th>
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">
                      Dept / College
                    </th>
                    <th className="text-left text-[10.5px] font-bold uppercase tracking-wide text-gray-500 px-5 py-3">
                      Since
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sorted.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-mist flex items-center justify-center font-heading font-bold text-[11.5px] text-primary shrink-0">
                            {initials(o.name)}
                          </div>
                          <div>
                            <div className="text-[13px] font-bold text-forest">{o.name}</div>
                            <div className="text-[11px] text-gray-500">{o.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-bold bg-mist text-primary px-2.5 py-1 rounded-full">
                          {POSITION_LABELS[o.officerPosition ?? ""] ?? o.officerPosition ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-gray-600">{o.collegeOrDept}</td>
                      <td className="px-5 py-3.5 text-[12px] text-gray-500">{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Global Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-forest text-white px-5 py-3 rounded-xl shadow-xl font-medium text-sm flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <svg className="w-5 h-5 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
