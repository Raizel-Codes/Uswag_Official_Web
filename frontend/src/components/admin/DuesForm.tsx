import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFeeRoster, recordDues } from '@/services/financeService';
import type { FeeRoster, FeeRosterMember } from '@/types/finance.types';
import Panel from '@/components/portal/Panel';
import { apiError } from '@/components/admin/format';
import { FEE_LABEL, FEE_TONE, feeDetail, peso } from '@/components/admin/fee';

const MAX_SHOWN = 8;

/** Already paid in full, or serving as an officer: nothing to record, so the row is greyed out. */
const settled = (m: FeeRosterMember) => m.fee.state === 'paid' || m.fee.state === 'exempt';

/**
 * Record a membership-fee payment. The Treasurer types a name, picks the member from the roster
 * (so the payment is tied to a real account, not to a typed name), and the amount defaults to what
 * that person still owes. People who have already paid, and serving officers, are listed but greyed
 * out and can't be chosen. A part payment is fine: the rest is then due within the window the
 * server reports.
 */
export default function DuesForm({ onSaved }: { onSaved: (message: string) => void }) {
  const queryClient = useQueryClient();
  const rosterQ = useQuery<FeeRoster>({ queryKey: ['finance', 'roster'], queryFn: getFeeRoster, staleTime: 30_000 });
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<FeeRosterMember | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || picked) return [];
    return (rosterQ.data?.members ?? []).filter((m) => m.name.toLowerCase().includes(q) || m.serialNumber.toLowerCase().includes(q)).slice(0, MAX_SHOWN);
  }, [query, picked, rosterQ.data]);

  const pay = useMutation({
    mutationFn: () => recordDues({ memberId: picked!.id, amount: parseFloat(amount) }),
    onSuccess: () => {
      const who = picked!.name;
      setPicked(null);
      setQuery('');
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onSaved(`Payment recorded for ${who}`);
    },
  });

  function choose(m: FeeRosterMember) {
    if (settled(m)) return;
    setPicked(m);
    setQuery(m.name);
    setAmount(String(m.fee.due));
    setError(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!picked) return setError('Pick the member who paid from the list.');
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) return setError('Enter an amount greater than zero.');
    if (amt > picked.fee.due) return setError(`${picked.name} only owes ${peso(picked.fee.due)}. Enter that or less.`);
    try {
      await pay.mutateAsync();
    } catch (err) {
      setError(apiError(err, 'That didn’t save. Please try again.'));
    }
  }

  const fee = rosterQ.data?.rules.amount;
  const partial = picked && parseFloat(amount) > 0 && parseFloat(amount) < picked.fee.due;

  return (
    <Panel title="Record a membership payment" id="record-dues" className="scroll-mt-6">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="relative">
          <label htmlFor="dues-member" className="ap-label">Member name</label>
          <input
            id="dues-member"
            value={query}
            autoComplete="off"
            onChange={(e) => {
              setQuery(e.target.value);
              setPicked(null);
              setAmount('');
            }}
            placeholder="Start typing a name"
            aria-describedby="dues-member-hint"
            className="ap-input"
          />
          <p id="dues-member-hint" className="ap-hint">
            {rosterQ.isError ? 'The member list didn’t load. Reload the page.' : picked ? `${picked.collegeOrDept} · ${picked.serialNumber}` : 'Members who have already paid are greyed out.'}
          </p>
          {matches.length > 0 && (
            <ul className="mt-2 border border-forest/15 rounded-sm bg-white/70 divide-y divide-forest/10 max-h-72 overflow-y-auto uw-scroll" aria-label="Matching members">
              {matches.map((m) => {
                const off = settled(m);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => choose(m)}
                      aria-disabled={off}
                      tabIndex={off ? -1 : 0}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 ${off ? 'opacity-55 cursor-not-allowed' : 'hover:bg-sage/20 focus-visible:bg-sage/20'}`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold truncate">{m.name}</span>
                        <span className="block mp-muted text-[0.8125rem] truncate">
                          {m.collegeOrDept} · {feeDetail({ ...m.fee, removedOn: m.removedOn })}
                        </span>
                      </span>
                      <span className={`mp-standing ${FEE_TONE[m.fee.state]} shrink-0`}>{FEE_LABEL[m.fee.state]}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {query.trim() && !picked && matches.length === 0 && rosterQ.data && <p className="ap-hint mt-2">No member matches “{query.trim()}”.</p>}
        </div>

        <div>
          <label htmlFor="dues-amount" className="ap-label">Amount (₱)</label>
          <input
            id="dues-amount"
            type="number"
            inputMode="decimal"
            min="1"
            step="0.01"
            value={amount}
            disabled={!picked}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={fee ? String(fee) : '50.00'}
            className="ap-input"
          />
          {picked && (
            <p className="ap-hint">
              {partial
                ? `A part payment: the remaining ${peso(picked.fee.due - parseFloat(amount))} is due within ${rosterQ.data?.rules.partialMonths ?? 3} months of the first payment, or the membership returns to pending.`
                : `Owes ${peso(picked.fee.due)}.`}
            </p>
          )}
        </div>

        {error && <p role="alert" className="mp-alert">{error}</p>}
        <button type="submit" disabled={pay.isPending || !picked} className="mp-btn mp-btn--primary w-full sm:w-auto">
          {pay.isPending ? 'Recording…' : 'Record payment'}
        </button>
      </form>
    </Panel>
  );
}
