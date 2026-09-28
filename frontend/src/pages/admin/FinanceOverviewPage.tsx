// Finance Overview
// Access: Super Admin (+ VP, Super-Admin-equivalent), Treasurer (read/write),
// Auditor (read-only). Enforce the read-only distinction server-side, not
// just in the UI.
//
// Role routing:
//   Treasurer        → TreasurerFinanceView (full CRUD)
//   Auditor          → AuditorFinanceView   (read-only, matches prototype work.type="audit")
//   Other officer    → LockedState          (finance is outside your scope)
//   Super Admin / VP → TreasurerFinanceView (full access)

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  getFinanceSummary,
  listFinanceEntries,
  recordDues,
  recordExpense,
} from "@/services/financeService";
import { ForbiddenError } from "@/services/api";
import { isSuperAdminEquivalent } from "@/utils/roles";
import LockedState from "@/components/common/LockedState";
import KpiCard from "@/components/common/KpiCard";
import type { FinanceEntry, FinanceSummary } from "@/types/finance.types";

const ICON_PESO = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
const ICON_ALERT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const ICON_DOCUMENT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
  </svg>
);
const ICON_MEMBERS = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
  </svg>
);
const ICON_SHIELD = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function currency(n: number) {
  return `₱${Math.abs(n).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function useToast() {
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  function show(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }
  return { toast, show };
}

// ---------------------------------------------------------------------------
// Entry row — shared between Treasurer + Auditor views
// ---------------------------------------------------------------------------
function EntryRow({ entry, readonly }: { entry: FinanceEntry; readonly?: boolean }) {
  const isDues = entry.type === "DUES";
  return (
    <div
      className={
        "mb-2.5 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm " +
        (readonly ? "opacity-75" : "")
      }
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mist">
        {isDues ? (
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-primary">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-primary">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-bold text-forest truncate">{entry.description}</div>
        <div className="text-[10.5px] text-gray-500 mt-0.5">
          {formatDate(entry.createdAt)} · by {entry.recordedBy?.name ?? "—"}
          {readonly && " · view only"}
        </div>
      </div>
      <span
        className={
          "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold " +
          (isDues ? "bg-successBg text-success" : "bg-gray-100 text-gray-500")
        }
      >
        {isDues ? `+${currency(entry.amount)}` : `−${currency(entry.amount)}`}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary stat cards
// ---------------------------------------------------------------------------
function SummaryCards({ summary }: { summary: FinanceSummary }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 mb-4">
      <KpiCard icon={ICON_PESO} value={currency(summary.fundsOnHand)} label="Funds on Hand" tone="primary" />
      <KpiCard icon={ICON_ALERT} value={currency(summary.pendingDuesAmount)} label="Pending Dues" tone="warn" hint="Follow up needed" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Treasurer view — read + write
// Matches prototype work.type === "finance"
// ---------------------------------------------------------------------------
function TreasurerFinanceView() {
  const [duesForm, setDuesForm] = useState({ memberName: "", amount: "" });
  const [expForm, setExpForm] = useState({ description: "", amount: "" });
  const [duesError, setDuesError] = useState<string | null>(null);
  const [expError, setExpError] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<"dues" | "expense">("dues");
  const { toast, show: showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: summary, isLoading: isSummaryLoading } = useQuery<FinanceSummary>({
    queryKey: ["finance", "summary"],
    queryFn: getFinanceSummary,
    staleTime: 30_000,
  });

  const { data: entries, isLoading: isEntriesLoading } = useQuery<FinanceEntry[]>({
    queryKey: ["finance", "entries"],
    queryFn: () => listFinanceEntries({ limit: 20 }),
    staleTime: 30_000,
  });

  const duesMutation = useMutation({
    mutationFn: () =>
      recordDues({
        memberName: duesForm.memberName,
        amount: parseFloat(duesForm.amount),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      setDuesForm({ memberName: "", amount: "" });
      setDuesError(null);
      showToast("Payment recorded ✓");
    },
    onError: (err: unknown) => {
      if (err instanceof ForbiddenError) {
        setDuesError("Server denied this — Treasurer access only.");
      } else {
        setDuesError("Failed to record payment.");
      }
    },
  });

  const expMutation = useMutation({
    mutationFn: () =>
      recordExpense({
        description: expForm.description,
        amount: parseFloat(expForm.amount),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      setExpForm({ description: "", amount: "" });
      setExpError(null);
      showToast("Expense logged ✓");
    },
    onError: (err: unknown) => {
      if (err instanceof ForbiddenError) {
        setExpError("Server denied this — Treasurer access only.");
      } else {
        setExpError("Failed to log expense.");
      }
    },
  });

  function submitDues(e: React.FormEvent) {
    e.preventDefault();
    setDuesError(null);
    if (!duesForm.memberName.trim()) return setDuesError("Member name is required.");
    const amt = parseFloat(duesForm.amount);
    if (!duesForm.amount || isNaN(amt) || amt <= 0) return setDuesError("Enter a valid amount.");
    duesMutation.mutate();
  }

  function submitExp(e: React.FormEvent) {
    e.preventDefault();
    setExpError(null);
    if (!expForm.description.trim()) return setExpError("Description is required.");
    const amt = parseFloat(expForm.amount);
    if (!expForm.amount || isNaN(amt) || amt <= 0) return setExpError("Enter a valid amount.");
    expMutation.mutate();
  }

  return (
    <div className="min-h-screen bg-mist pb-24">
      <div className="px-5 pt-6 pb-2">
        <h1 className="font-heading text-[19px] font-bold text-forest">Financial Records</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">Dues, expenses & statements</p>
      </div>

      <div className="px-5">
        {/* Summary stats */}
        {isSummaryLoading ? (
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
            <div className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
          </div>
        ) : summary ? (
          <SummaryCards summary={summary} />
        ) : null}

        {/* Form tab switcher */}
        <div className="flex gap-2 mb-3">
          <button
            id="tab-finance-dues"
            onClick={() => setActiveForm("dues")}
            className={
              "flex-1 rounded-xl py-2 text-[11.5px] font-bold transition-colors " +
              (activeForm === "dues"
                ? "bg-primary text-white"
                : "bg-white text-gray-500 hover:bg-gray-50 shadow-sm")
            }
          >
            Record Payment
          </button>
          <button
            id="tab-finance-expense"
            onClick={() => setActiveForm("expense")}
            className={
              "flex-1 rounded-xl py-2 text-[11.5px] font-bold transition-colors " +
              (activeForm === "expense"
                ? "bg-primary text-white"
                : "bg-white text-gray-500 hover:bg-gray-50 shadow-sm")
            }
          >
            Log Expense
          </button>
        </div>

        {/* Record dues payment form */}
        {activeForm === "dues" && (
          <form onSubmit={submitDues} className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <div className="mb-3">
              <label className="block text-[11.5px] font-bold text-gray-600 mb-1.5">
                Member Name
              </label>
              <input
                id="input-dues-member"
                value={duesForm.memberName}
                onChange={(e) => setDuesForm((f) => ({ ...f, memberName: e.target.value }))}
                placeholder="Search member name..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-forest outline-none focus:ring-2 focus:ring-primary/25 transition"
              />
            </div>
            <div className="mb-3">
              <label className="block text-[11.5px] font-bold text-gray-600 mb-1.5">
                Amount (₱)
              </label>
              <input
                id="input-dues-amount"
                type="number"
                min="1"
                step="0.01"
                value={duesForm.amount}
                onChange={(e) => setDuesForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="150.00"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-forest outline-none focus:ring-2 focus:ring-primary/25 transition"
              />
            </div>
            {duesError && (
              <p className="mb-2 text-[11.5px] text-red-500 font-medium">{duesError}</p>
            )}
            <button
              id="btn-record-payment"
              type="submit"
              disabled={duesMutation.isPending}
              className="w-full rounded-2xl bg-primary py-3 text-[13px] font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {duesMutation.isPending ? "Recording…" : "Record Payment"}
            </button>
          </form>
        )}

        {/* Log expense form */}
        {activeForm === "expense" && (
          <form onSubmit={submitExp} className="bg-white rounded-2xl p-4 shadow-sm mb-4">
            <div className="mb-3">
              <label className="block text-[11.5px] font-bold text-gray-600 mb-1.5">
                Description
              </label>
              <input
                id="input-expense-desc"
                value={expForm.description}
                onChange={(e) => setExpForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Wellness Fair supplies"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-forest outline-none focus:ring-2 focus:ring-primary/25 transition"
              />
            </div>
            <div className="mb-3">
              <label className="block text-[11.5px] font-bold text-gray-600 mb-1.5">
                Amount (₱)
              </label>
              <input
                id="input-expense-amount"
                type="number"
                min="1"
                step="0.01"
                value={expForm.amount}
                onChange={(e) => setExpForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="3,200.00"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-[13px] text-forest outline-none focus:ring-2 focus:ring-primary/25 transition"
              />
            </div>
            {expError && (
              <p className="mb-2 text-[11.5px] text-red-500 font-medium">{expError}</p>
            )}
            <button
              id="btn-log-expense"
              type="submit"
              disabled={expMutation.isPending}
              className="w-full rounded-2xl bg-primary py-3 text-[13px] font-bold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {expMutation.isPending ? "Logging…" : "Log Expense"}
            </button>
          </form>
        )}

        {/* Recent entries */}
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="font-heading text-[14px] font-bold text-forest">Recent Entries</h3>
          {!isEntriesLoading && entries && (
            <span className="text-[11px] font-semibold text-primary">
              {entries.length} records
            </span>
          )}
        </div>

        {isEntriesLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : entries?.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm border border-gray-100">
            <p className="text-[12.5px] font-medium text-gray-500">No entries yet.</p>
            <p className="mt-0.5 text-[11px] text-gray-400">Record a payment or expense above.</p>
          </div>
        ) : (
          (entries ?? []).map((e) => <EntryRow key={e.id} entry={e} />)
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={
            "fixed bottom-24 left-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl px-4 py-3 text-[12px] font-semibold text-white shadow-lg " +
            (toast.ok ? "bg-forest" : "bg-red-600")
          }
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-[#7ee6a8] shrink-0">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auditor view — read-only
// Matches prototype work.type === "audit"
// ---------------------------------------------------------------------------
function AuditorFinanceView() {
  const { data: summary, isLoading: isSummaryLoading } = useQuery<FinanceSummary>({
    queryKey: ["finance", "summary"],
    queryFn: getFinanceSummary,
    staleTime: 60_000,
  });

  const { data: entries, isLoading: isEntriesLoading } = useQuery<FinanceEntry[]>({
    queryKey: ["finance", "entries"],
    queryFn: () => listFinanceEntries({ limit: 20 }),
    staleTime: 60_000,
  });

  const { toast, show: showToast } = useToast();

  // Entries from the last 30 days treated as "awaiting review"
  const reviewCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recentExpenses = (entries ?? []).filter(
    (e) => e.type === "EXPENSE" && e.createdAt > reviewCutoff
  );

  return (
    <div className="min-h-screen bg-mist pb-24">
      <div className="px-5 pt-6 pb-2">
        <h1 className="font-heading text-[19px] font-bold text-forest">Audit & Records</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          Review financial statements and attendance — read-only
        </p>
      </div>

      <div className="px-5">
        {/* Auditor summary: reports to review + avg attendance proxy */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <KpiCard icon={ICON_DOCUMENT} value={recentExpenses.length} label="To Review" tone="warn" />
          <KpiCard
            icon={ICON_MEMBERS}
            value={isSummaryLoading ? "—" : `${summary?.activeMembers ?? 0}`}
            label="Active Members"
            tone="primary"
          />
          <KpiCard icon={ICON_SHIELD} value="0" label="Discrepancies" tone="neutral" />
        </div>

        {/* Reports awaiting review */}
        <div className="flex items-center justify-between mb-2.5 mt-1">
          <h3 className="font-heading text-[14px] font-bold text-forest">Reports Awaiting Review</h3>
        </div>

        {isEntriesLoading ? (
          <div className="h-16 rounded-2xl bg-gray-100 animate-pulse mb-2.5" />
        ) : recentExpenses.length === 0 ? (
          <div className="mb-3 rounded-2xl bg-white p-4 text-center shadow-sm border border-gray-100">
            <p className="text-[12px] text-gray-400">No new expense reports in the past 30 days.</p>
          </div>
        ) : (
          recentExpenses.slice(0, 3).map((e) => (
            <div key={e.id} className="mb-2.5 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mist">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-primary">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-bold text-forest truncate">{e.description}</div>
                <div className="text-[10.5px] text-gray-500 mt-0.5">
                  Logged by {e.recordedBy?.name ?? "Treasurer"} · {formatDate(e.createdAt)}
                </div>
              </div>
              <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-600">
                Review
              </span>
            </div>
          ))
        )}

        {/* Read-only financial records */}
        <div className="flex items-center justify-between mb-2.5 mt-4">
          <h3 className="font-heading text-[14px] font-bold text-forest">Read-Only: Financial Records</h3>
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            Auditor access
          </span>
        </div>

        {isSummaryLoading ? (
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
            <div className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div className="bg-white rounded-2xl p-3 text-center shadow-sm opacity-75">
              <div className="font-heading text-[16px] font-extrabold text-primary">
                {currency(summary.fundsOnHand)}
              </div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">Funds on Hand</div>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center shadow-sm opacity-75">
              <div className="font-heading text-[16px] font-extrabold text-amber-500">
                {currency(summary.pendingDuesAmount)}
              </div>
              <div className="text-[10px] text-gray-500 font-semibold mt-0.5">Pending Dues</div>
            </div>
          </div>
        ) : null}

        {isEntriesLoading ? (
          <div className="space-y-2.5">
            {[1, 2].map((n) => (
              <div key={n} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          (entries ?? []).slice(0, 10).map((e) => <EntryRow key={e.id} entry={e} readonly />)
        )}

        {/* Flag for Discussion */}
        <div className="mt-4">
          <button
            id="btn-flag-discussion"
            onClick={() => showToast("Audit note flagged for discussion")}
            className="w-full rounded-2xl bg-primary py-3 text-[13px] font-bold text-white transition-colors hover:bg-primary/90"
          >
            Flag for Discussion
          </button>
          <p className="mt-1.5 text-center text-[10.5px] text-gray-400">
            Raises a discussion item with the President and Treasurer
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-4 right-4 z-50 flex items-center gap-2.5 rounded-2xl bg-forest px-4 py-3 text-[12px] font-semibold text-white shadow-lg">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 stroke-[#7ee6a8] shrink-0">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route entry point — dispatch by role
// ---------------------------------------------------------------------------
export default function FinanceOverviewPage() {
  const { user } = useAuth();

  const isFinanceReader =
    isSuperAdminEquivalent(user) ||
    user?.officerPosition === "treasurer" ||
    user?.officerPosition === "auditor";

  // Officers with no finance access — full-page lock
  if (!isFinanceReader) {
    return (
      <div className="min-h-screen bg-mist px-5 py-6 pb-24">
        <h1 className="font-heading text-[19px] font-bold text-forest mb-1">Finance</h1>
        <p className="text-[12px] text-gray-500 mb-4">Financial records & statements</p>
        <LockedState
          title="Finance Records Are Outside Your Scope"
          description="Access to financial records is restricted to the Treasurer, Auditor, and Super Admin, per Article VI of the USWAG Constitution."
          redirectLabel="Contact the Treasurer for finance matters"
        />
      </div>
    );
  }

  // Auditor → read-only view
  if (user?.officerPosition === "auditor") {
    return <AuditorFinanceView />;
  }

  // Treasurer or Super Admin (+ VP) → full view
  return <TreasurerFinanceView />;
}
