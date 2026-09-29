// Finance — Treasurer (read + write), Auditor (read-only), Super Admin / VP (full).
// The read-only distinction is enforced server-side (canWriteFinance / canReadFinance in
// finance.routes.ts), not just here.
//
//   Treasurer, Super Admin / VP → TreasurerFinanceView (record dues / expenses + ledger)
//   Auditor                     → AuditorFinanceView  (ledger + attendance records, read-only)
//   Any other officer           → LockedState
//
// `?focus=record-dues | record-expense | ledger | audit-ledger | audit-attendance` jumps to a
// section (the Home quick actions use it).

import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { usePortalToast } from '@/hooks/usePortalToast';
import { useFocusParam } from '@/hooks/useFocusParam';
import { getFinanceSummary, listFinanceEntries, recordDues, recordExpense } from '@/services/financeService';
import { listAttendance } from '@/services/attendanceService';
import { isSuperAdminEquivalent } from '@/utils/roles';
import type { FinanceEntry, FinanceSummary } from '@/types/finance.types';
import type { AttendanceOversightEntry } from '@/types/event.types';
import LockedState from '@/components/common/LockedState';
import PageHeader from '@/components/portal/PageHeader';
import Panel from '@/components/portal/Panel';
import StatPlate from '@/components/portal/StatPlate';
import PortalToast from '@/components/portal/PortalToast';
import StackedBar from '@/components/admin/StackedBar';
import BarList from '@/components/admin/BarList';
import BoardGroup from '@/components/admin/BoardGroup';
import { apiError, currency, formatDateTime, initials } from '@/components/admin/format';

// ---------------------------------------------------------------------------
// Charts — money in vs out, and the ledger grouped by month
// ---------------------------------------------------------------------------
function MoneyFlow({ s }: { s?: FinanceSummary }) {
  if (!s) return <div className="space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-6" />)}</div>;
  const dues = Math.abs(s.totalDues);
  const spent = Math.abs(s.totalExpenses);
  const owed = Math.abs(s.pendingDuesAmount);
  return (
    <BarList
      label="Money in, out and outstanding"
      rows={[
        { key: 'in', label: 'Dues collected', value: currency(dues), segments: [{ label: 'Dues collected', value: dues, tone: 'success' }] },
        { key: 'out', label: 'Expenses', value: currency(spent), segments: [{ label: 'Expenses', value: spent, tone: 'danger' }] },
        { key: 'owed', label: 'Dues outstanding', value: currency(owed), segments: [{ label: 'Dues outstanding', value: owed, tone: 'warn' }] },
      ]}
    />
  );
}

/** The ledger as month groups: each month's net on the header and an in/out bar as its summary. */
function LedgerBoard({ entries, loading, readOnly }: { entries?: FinanceEntry[]; loading: boolean; readOnly?: boolean }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  if (loading || !entries?.length) return <Panel flush><Ledger entries={entries} loading={loading} readOnly={readOnly} /></Panel>;

  const months: { key: string; label: string; list: FinanceEntry[] }[] = [];
  for (const e of [...entries].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))) {
    const d = new Date(e.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const last = months[months.length - 1];
    if (last?.key === key) last.list.push(e);
    else months.push({ key, label: d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }), list: [e] });
  }

  return (
    <div className="ap-board">
      {months.map((m, i) => {
        const inflow = m.list.filter((e) => e.type === 'DUES').reduce((s, e) => s + Math.abs(e.amount), 0);
        const outflow = m.list.filter((e) => e.type === 'EXPENSE').reduce((s, e) => s + Math.abs(e.amount), 0);
        const net = inflow - outflow;
        return (
          <BoardGroup
            key={m.key}
            id={`ledger-${m.key}`}
            title={m.label}
            count={`${m.list.length} ${m.list.length === 1 ? 'entry' : 'entries'} · net ${net < 0 ? '−' : '+'}${currency(Math.abs(net))}`}
            accent={i === 0 ? 0 : 3}
            summary={
              <StackedBar
                label={`${m.label}, in and out`}
                segments={[
                  { label: 'In', value: inflow, tone: 'success' },
                  { label: 'Out', value: outflow, tone: 'danger' },
                ]}
              />
            }
            open={!collapsed.has(m.key)}
            onToggle={() =>
              setCollapsed((prev) => {
                const next = new Set(prev);
                if (next.has(m.key)) next.delete(m.key);
                else next.add(m.key);
                return next;
              })
            }
          >
            <Ledger entries={m.list} loading={false} readOnly={readOnly} />
          </BoardGroup>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ledger — shared by both views
// ---------------------------------------------------------------------------
function Ledger({ entries, loading, readOnly }: { entries?: FinanceEntry[]; loading: boolean; readOnly?: boolean }) {
  if (loading) {
    return <div className="p-5 space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-12" />)}</div>;
  }
  if (!entries?.length) {
    return <p className="p-8 mp-muted text-center">No entries yet.{readOnly ? '' : ' Record a payment or an expense above.'}</p>;
  }
  return (
    <ul className="ap-list">
      {entries.map((e) => {
        const dues = e.type === 'DUES';
        return (
          <li key={e.id} className="ap-row">
            <span className={`mp-standing ${dues ? 'mp-standing--active' : 'mp-standing--neutral'} shrink-0 !tracking-[0.08em]`}>{dues ? 'Dues' : 'Expense'}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{e.description}</p>
              <p className="mp-muted text-[0.8125rem]">
                {formatDateTime(e.createdAt)} · by {e.recordedBy?.name ?? '—'}
              </p>
            </div>
            <span className={`mp-num font-semibold text-[1rem] shrink-0 ${dues ? 'text-primary' : ''}`}>
              {dues ? '+' : '−'}
              {currency(Math.abs(e.amount))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Treasurer / Super Admin — record dues and expenses
// ---------------------------------------------------------------------------
function RecordForm({
  id,
  title,
  firstLabel,
  firstPlaceholder,
  amountPlaceholder,
  submitLabel,
  pendingLabel,
  onSubmit,
  pending,
}: {
  id: string;
  title: string;
  firstLabel: string;
  firstPlaceholder: string;
  amountPlaceholder: string;
  submitLabel: string;
  pendingLabel: string;
  onSubmit: (first: string, amount: number) => Promise<unknown>;
  pending: boolean;
}) {
  const [first, setFirst] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!first.trim()) return setError(`${firstLabel} is required.`);
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) return setError('Enter an amount greater than zero.');
    try {
      await onSubmit(first.trim(), amt);
      setFirst('');
      setAmount('');
    } catch (err) {
      setError(apiError(err, 'That didn’t save. Please try again.'));
    }
  }

  return (
    <Panel title={title} id={id} className="scroll-mt-6">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor={`${id}-first`} className="ap-label">{firstLabel}</label>
          <input id={`${id}-first`} value={first} onChange={(e) => setFirst(e.target.value)} placeholder={firstPlaceholder} className="ap-input" />
        </div>
        <div>
          <label htmlFor={`${id}-amount`} className="ap-label">Amount (₱)</label>
          <input id={`${id}-amount`} type="number" inputMode="decimal" min="1" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={amountPlaceholder} className="ap-input" />
        </div>
        {error && <p role="alert" className="mp-alert">{error}</p>}
        <button type="submit" disabled={pending} className="mp-btn mp-btn--primary w-full sm:w-auto">
          {pending ? pendingLabel : submitLabel}
        </button>
      </form>
    </Panel>
  );
}

function TreasurerFinanceView() {
  const { user } = useAuth();
  const { toast, show } = usePortalToast();
  const queryClient = useQueryClient();
  const summaryQ = useQuery<FinanceSummary>({ queryKey: ['finance', 'summary'], queryFn: getFinanceSummary, staleTime: 30_000 });
  const entriesQ = useQuery<FinanceEntry[]>({ queryKey: ['finance', 'entries'], queryFn: () => listFinanceEntries({ limit: 20 }), staleTime: 30_000 });
  useFocusParam(!summaryQ.isLoading);

  const onSaved = (msg: string) => {
    queryClient.invalidateQueries({ queryKey: ['finance'] });
    show(msg);
  };
  const dues = useMutation({ mutationFn: (p: { memberName: string; amount: number }) => recordDues(p), onSuccess: () => onSaved('Payment recorded') });
  const expense = useMutation({ mutationFn: (p: { description: string; amount: number }) => recordExpense(p), onSuccess: () => onSaved('Expense logged') });
  const s = summaryQ.data;

  return (
    <div className="mp-page space-y-8">
      <PageHeader
        eyebrow={isSuperAdminEquivalent(user) ? 'Oversight · Finance' : 'Work · Treasurer'}
        title="Financial records"
        lead="Every peso in and out, recorded once and visible to the Auditor."
      />

      <dl className="ap-stats-row">
        <StatPlate label="On hand" value={s ? currency(s.fundsOnHand) : '…'} tone="primary" hint="Funds" />
        <StatPlate label="Collected" value={s ? currency(s.totalDues) : '…'} tone="primary" hint="Dues" />
        <StatPlate label="Outstanding" value={s ? currency(s.pendingDuesAmount) : '…'} tone="warn" hint="Dues to follow up" />
      </dl>

      <Panel title="Money in and out">
        <MoneyFlow s={s} />
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <RecordForm
          id="record-dues"
          title="Record a dues payment"
          firstLabel="Member name"
          firstPlaceholder="Full name as on the roster"
          amountPlaceholder="50.00"
          submitLabel="Record payment"
          pendingLabel="Recording…"
          pending={dues.isPending}
          onSubmit={(memberName, amount) => dues.mutateAsync({ memberName, amount })}
        />
        <RecordForm
          id="record-expense"
          title="Log an expense"
          firstLabel="Description"
          firstPlaceholder="e.g. Wellness Fair supplies"
          amountPlaceholder="0.00"
          submitLabel="Log expense"
          pendingLabel="Logging…"
          pending={expense.isPending}
          onSubmit={(description, amount) => expense.mutateAsync({ description, amount })}
        />
      </div>

      <section id="ledger" aria-labelledby="ledger-title" className="scroll-mt-6 space-y-4">
        <div className="flex items-center gap-4">
          <h2 id="ledger-title" className="mp-h2 flex-1">Ledger</h2>
          {entriesQ.data && <span className="mp-muted text-[0.8125rem]">Latest {entriesQ.data.length}</span>}
        </div>
        <LedgerBoard entries={entriesQ.data} loading={entriesQ.isLoading} />
      </section>

      <PortalToast toast={toast} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auditor — read-only ledger + attendance records (Article VI oversight)
// ---------------------------------------------------------------------------
const RESULT: Record<AttendanceOversightEntry['result'], { cls: string; label: string }> = {
  VALID: { cls: 'mp-standing--active', label: 'Valid' },
  EXPIRED: { cls: 'mp-standing--expired', label: 'Expired' },
  INVALID: { cls: 'mp-standing--rejected', label: 'Invalid' },
};

function AuditorFinanceView() {
  const summaryQ = useQuery<FinanceSummary>({ queryKey: ['finance', 'summary'], queryFn: getFinanceSummary, staleTime: 60_000 });
  const entriesQ = useQuery<FinanceEntry[]>({ queryKey: ['finance', 'entries'], queryFn: () => listFinanceEntries({ limit: 20 }), staleTime: 60_000 });
  const attendanceQ = useQuery<AttendanceOversightEntry[]>({ queryKey: ['attendance', 'records'], queryFn: () => listAttendance({ limit: 30 }), staleTime: 60_000 });
  useFocusParam(!entriesQ.isLoading && !attendanceQ.isLoading);

  const cutoff = Date.now() - 30 * 24 * 3600_000;
  const toReview = (entriesQ.data ?? []).filter((e) => e.type === 'EXPENSE' && new Date(e.createdAt).getTime() > cutoff);
  const s = summaryQ.data;

  return (
    <div className="mp-page space-y-8">
      <PageHeader
        eyebrow="Work · Auditor"
        title="Audit & records"
        lead="Finances and attendance, read-only. You can't record entries or scan; that separation is what makes the audit independent (Article VI)."
      />

      <dl className="ap-stats-row">
        <StatPlate label="To review" value={entriesQ.data ? toReview.length : '…'} tone={toReview.length ? 'warn' : 'neutral'} hint="Expenses, 30 days" />
        <StatPlate label="On hand" value={s ? currency(s.fundsOnHand) : '…'} tone="primary" hint="Funds" />
        <StatPlate label="Outstanding" value={s ? currency(s.pendingDuesAmount) : '…'} tone="warn" hint="Dues" />
      </dl>

      <Panel title="Expenses to review" aside={<span className="mp-muted">Last 30 days</span>} flush>
        <Ledger entries={toReview} loading={entriesQ.isLoading} readOnly />
      </Panel>

      <Panel title="Money in and out">
        <MoneyFlow s={s} />
      </Panel>

      <section id="audit-ledger" aria-labelledby="audit-ledger-title" className="scroll-mt-6 space-y-4">
        <div className="flex items-center gap-4">
          <h2 id="audit-ledger-title" className="mp-h2 flex-1">Financial ledger</h2>
          <span className="mp-standing mp-standing--neutral">Read-only</span>
        </div>
        <LedgerBoard entries={entriesQ.data} loading={entriesQ.isLoading} readOnly />
      </section>

      <Panel title="Attendance records" id="audit-attendance" className="scroll-mt-6" aside={<span className="mp-standing mp-standing--neutral">Read-only</span>} flush>
        {attendanceQ.isLoading ? (
          <div className="p-5 space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-12" />)}</div>
        ) : attendanceQ.isError ? (
          <p role="alert" className="m-5 mp-alert">{apiError(attendanceQ.error, 'We couldn’t load attendance records.')}</p>
        ) : !attendanceQ.data?.length ? (
          <p className="p-8 mp-muted text-center">No scans recorded yet.</p>
        ) : (
          <ul className="ap-list">
            {attendanceQ.data.map((r) => (
              <li key={r.id} className="ap-row items-start">
                <span className="ap-avatar" aria-hidden="true">{initials(r.member?.user.name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{r.member?.user.name ?? 'Unrecognised card'}</p>
                  <p className="mp-muted text-[0.8125rem]">
                    {r.event?.title ?? 'Event no longer listed'} · {formatDateTime(r.scannedAt)} · scanned by {r.scannedByOfficer?.name ?? '—'}
                    {r.result !== 'VALID' && r.reason ? ` · ${r.reason}` : ''}
                  </p>
                </div>
                <span className={`mp-standing ${RESULT[r.result].cls} shrink-0`}>{RESULT[r.result].label}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="mp-note">
        <p>
          <strong className="font-semibold">Audit reports.</strong> The console doesn’t have a way to submit an audit report yet. Put findings
          in writing to the President and the Treasurer until it does.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Route entry — dispatch by role
// ---------------------------------------------------------------------------
export default function FinanceOverviewPage() {
  const { user } = useAuth();
  const reader = isSuperAdminEquivalent(user) || user?.officerPosition === 'treasurer' || user?.officerPosition === 'auditor';

  if (!reader) {
    return (
      <div className="mp-page space-y-8">
        <PageHeader eyebrow="Finance" title="Financial records" />
        <LockedState
          title="Finance is outside your scope"
          description="Financial records are kept by the Treasurer and reviewed by the Auditor and the Super Admin, per Article VI of the USWAG Constitution."
          redirectLabel="Contact the Treasurer for finance matters"
        />
      </div>
    );
  }
  if (user?.officerPosition === 'auditor') return <AuditorFinanceView />;
  return <TreasurerFinanceView />;
}
