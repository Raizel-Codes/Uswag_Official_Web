// Bylaws & Amendments
// SUPER ADMIN ONLY — publish constitution updates, log amendments per Article IX.
// ACCESS: RoleRoute allow={['super_admin']} in AppRoutes.tsx redirects non-super-admin
//         to "/" before this component is ever mounted.
//         requireRole('SUPER_ADMIN') in bylaws.routes.ts is the actual server boundary.

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listAmendments,
  proposeAmendment,
  resolveAmendment,
  type AmendmentLog,
} from "@/services/adminService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<
  AmendmentLog["status"],
  { label: string; cls: string; dot: string }
> = {
  proposed: {
    label: "Awaiting vote",
    cls: "bg-amber-50 text-amber-600",
    dot: "bg-amber-400",
  },
  approved: {
    label: "Approved",
    cls: "bg-successBg text-success",
    dot: "bg-success",
  },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-500", dot: "bg-red-400" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  function show(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(null), 3000);
  }
  return { msg, show };
}

// ---------------------------------------------------------------------------
// Amendment row — matches prototype "Amendment Log" activity-item style
// ---------------------------------------------------------------------------
function AmendmentRow({
  amendment,
  onResolve,
  isResolving,
}: {
  amendment: AmendmentLog;
  onResolve: (id: string, status: "approved" | "rejected") => void;
  isResolving: boolean;
}) {
  const cfg = STATUS_CONFIG[amendment.status];

  return (
    <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
      {/* Icon */}
      <div className="mt-0.5 w-8 h-8 rounded-lg bg-mist flex items-center justify-center shrink-0">
        {amendment.status === "approved" ? (
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-primary">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : amendment.status === "rejected" ? (
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-red-400">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-primary">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="font-bold text-[13px] text-forest">{amendment.articleRef}</span>
            <span className="mx-1.5 text-gray-400">—</span>
            <span className="text-[12.5px] text-gray-600">{amendment.proposal}</span>
          </div>
          <span className={`shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${cfg.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
        <div className="mt-1 text-[11px] text-gray-400">
          Proposed {formatDate(amendment.createdAt)}
          {amendment.resolvedAt && ` · Resolved ${formatDate(amendment.resolvedAt)}`}
        </div>

        {/* Approve / Reject buttons for pending */}
        {amendment.status === "proposed" && (
          <div className="mt-2.5 flex gap-2">
            <button
              id={`btn-approve-amendment-${amendment.id}`}
              disabled={isResolving}
              onClick={() => onResolve(amendment.id, "approved")}
              className="rounded-lg bg-successBg px-3 py-1.5 text-[10.5px] font-bold text-success hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              Approve
            </button>
            <button
              id={`btn-reject-amendment-${amendment.id}`}
              disabled={isResolving}
              onClick={() => onResolve(amendment.id, "rejected")}
              className="rounded-lg bg-red-50 px-3 py-1.5 text-[10.5px] font-bold text-red-400 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Propose Amendment form
// ---------------------------------------------------------------------------
function ProposeForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ articleRef: "", proposal: "" });
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => proposeAmendment(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amendments"] });
      setForm({ articleRef: "", proposal: "" });
      setError(null);
      onSuccess();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to propose amendment");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.articleRef.trim()) return setError("Article reference is required.");
    if (!form.proposal.trim()) return setError("Proposal text is required.");
    mutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-heading font-bold text-[14.5px] text-forest mb-4">Propose Amendment</h3>
      <div className="mb-3">
        <label className="block text-[11.5px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
          Article Reference
        </label>
        <input
          id="input-article-ref"
          value={form.articleRef}
          onChange={(e) => setForm((f) => ({ ...f, articleRef: e.target.value }))}
          placeholder="e.g. Article VI, Sec. 1"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-forest outline-none focus:ring-2 focus:ring-primary/25 transition"
        />
      </div>
      <div className="mb-4">
        <label className="block text-[11.5px] font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
          Proposal
        </label>
        <textarea
          id="input-amendment-proposal"
          value={form.proposal}
          onChange={(e) => setForm((f) => ({ ...f, proposal: e.target.value }))}
          rows={3}
          placeholder="Describe the proposed change..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-forest outline-none focus:ring-2 focus:ring-primary/25 resize-none transition"
        />
      </div>
      {error && <p className="mb-3 text-[11.5px] text-red-500 font-medium">{error}</p>}
      <button
        id="btn-propose-amendment"
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-xl bg-primary py-2.5 text-[13px] font-bold text-white hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {mutation.isPending ? "Submitting…" : "Propose Amendment"}
      </button>
      <p className="mt-2 text-[10.5px] text-gray-400 text-center">
        Article IX — requires general assembly vote before approval
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function BylawsAmendmentsPage() {
  // Non-super-admin users are NEVER rendered here — RoleRoute redirects to "/".
  const { msg: toast, show: showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: amendments, isLoading, error } = useQuery<AmendmentLog[]>({
    queryKey: ["amendments"],
    queryFn: listAmendments,
    staleTime: 60_000,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      resolveAmendment(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["amendments"] });
      showToast(
        vars.status === "approved"
          ? "Amendment approved ✓"
          : "Amendment rejected",
      );
    },
    onError: (err: unknown) => {
      showToast(err instanceof Error ? err.message : "Failed to resolve amendment");
    },
  });

  const pending = (amendments ?? []).filter((a) => a.status === "proposed");
  const resolved = (amendments ?? []).filter((a) => a.status !== "proposed");

  return (
    <div className="min-h-screen bg-mist pb-10">
      {/* Header — matches prototype topbar */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[22px] font-bold text-forest">
            Constitution & By-Laws
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Publish updates and track amendments · Article IX
          </p>
        </div>
        <span className="bg-amber-50 text-amber-600 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 stroke-amber-500">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Super Admin Only
        </span>
      </div>

      <div className="px-6 py-6">
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-600">
            Failed to load amendments: {error instanceof Error ? error.message : "Unknown error"}
          </div>
        )}

        {/* Two-column layout: current doc + amendment log (mirrors prototype grid-2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          {/* Current document panel */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-heading font-bold text-[14.5px] text-forest">
                Current Document
              </h3>
              <span className="flex items-center gap-1.5 bg-successBg text-success text-[10.5px] font-bold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                Ratified
              </span>
            </div>
            <div className="p-5">
              {/* Constitution document card — matches prototype */}
              <div className="flex items-center gap-3 p-3 bg-mist rounded-xl">
                <div className="shrink-0">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--tw-shadow-color, #2e5b41)" strokeWidth="1.8" className="stroke-primary">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="13" x2="15" y2="13" />
                    <line x1="9" y1="17" x2="15" y2="17" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-forest truncate">
                    USWAG_Constitution_2026.pdf
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Ratified June 2026 · Visible to all members
                  </div>
                </div>
                <a
                  id="btn-download-bylaws"
                  href="/constitution.pdf"
                  download="USWAG_Constitution_2026.pdf"
                  className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shrink-0"
                  title="Download"
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-forest">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </a>
              </div>

              <div className="mt-4 space-y-2 text-[12px] text-gray-500">
                <div className="flex items-center justify-between">
                  <span>Active version</span>
                  <span className="font-semibold text-forest">2026 Edition</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pending amendments</span>
                  <span className={`font-bold ${pending.length > 0 ? "text-amber-500" : "text-success"}`}>
                    {isLoading ? "…" : pending.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total amendments logged</span>
                  <span className="font-semibold text-forest">
                    {isLoading ? "…" : (amendments?.length ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Propose amendment form */}
          <ProposeForm onSuccess={() => showToast("Amendment proposed — awaiting general assembly vote")} />
        </div>

        {/* Amendment log — pending first, then resolved */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-heading font-bold text-[14.5px] text-forest">Amendment Log</h3>
            {!isLoading && (
              <span className="text-[11px] font-semibold text-gray-400">
                {pending.length} pending · {resolved.length} resolved
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : amendments?.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-[13px] text-gray-500">No amendments on record.</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Use the form above to propose the first amendment.
              </p>
            </div>
          ) : (
            <>
              {/* Pending first */}
              {pending.map((a) => (
                <AmendmentRow
                  key={a.id}
                  amendment={a}
                  onResolve={(id, status) => resolveMutation.mutate({ id, status })}
                  isResolving={resolveMutation.isPending}
                />
              ))}
              {/* Resolved below */}
              {resolved.map((a) => (
                <AmendmentRow
                  key={a.id}
                  amendment={a}
                  onResolve={(id, status) => resolveMutation.mutate({ id, status })}
                  isResolving={resolveMutation.isPending}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 rounded-xl bg-forest px-4 py-3 text-[12px] font-semibold text-white shadow-lg">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-[#7ee6a8] shrink-0">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}
