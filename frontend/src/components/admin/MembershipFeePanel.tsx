import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFeeRoster, setMembershipFee } from '@/services/financeService';
import type { FeeRoster } from '@/types/finance.types';
import Panel from '@/components/portal/Panel';
import { apiError, formatDate } from '@/components/admin/format';
import { peso } from '@/components/admin/fee';

/**
 * The membership fee. The Treasurer (and Super Admin) can change it here; the Auditor sees it read-only.
 * It is stored in the database, so a change needs no redeploy: the Join Us and Application pages read the
 * same number. A change applies from now on. Payments already recorded keep the fee they were made under,
 * so nobody who paid in full becomes a debtor when the fee goes up (services/fee.service.ts).
 */
export default function MembershipFeePanel({ readOnly = false, onSaved }: { readOnly?: boolean; onSaved?: (message: string) => void }) {
  const queryClient = useQueryClient();
  const rosterQ = useQuery<FeeRoster>({ queryKey: ['finance', 'roster'], queryFn: getFeeRoster, staleTime: 30_000 });
  const rules = rosterQ.data?.rules;
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (amount: number) => setMembershipFee(amount),
    onSuccess: (fee) => {
      setValue('');
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['membership-fee'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onSaved?.(`Membership fee is now ${peso(fee.amount)}`);
    },
    onError: (err) => setError(apiError(err, 'Could not change the fee. Please try again.')),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const amount = Number(value);
    if (!value.trim() || !Number.isFinite(amount) || amount <= 0) return setError('Enter the new fee in pesos, more than zero.');
    if (Math.round(amount * 100) / 100 !== amount) return setError('Use at most two decimal places.');
    if (rules && amount === rules.amount) return setError(`The fee is already ${peso(rules.amount)}.`);
    save.mutate(amount);
  }

  return (
    <Panel
      title="Membership fee"
      id="membership-fee"
      className="scroll-mt-6"
      aside={readOnly ? <span className="mp-standing mp-standing--neutral">Read-only</span> : undefined}
    >
      <div className="grid gap-6 sm:grid-cols-2 sm:items-start">
        <div>
          <p className="mp-eyebrow" style={{ fontSize: '0.6875rem' }}>Current fee</p>
          <p className="mp-h2 mt-1">{rules ? peso(rules.amount) : '…'}</p>
          <p className="mp-muted text-[0.8125rem] mt-1">
            {rules ? (rules.since ? `Since ${formatDate(rules.since)}` : 'The starting fee, not changed yet') : 'Loading…'}
            {' · '}per academic year
          </p>
          {rules && rules.history.length > 0 && (
            <ul className="mt-4 space-y-1.5" aria-label="Recent changes to the fee">
              {rules.history.map((h) => (
                <li key={h.effectiveFrom} className="text-[0.8125rem] mp-muted">
                  <span className="font-semibold text-[color:var(--color-deep)]">{peso(h.amount)}</span> from {formatDate(h.effectiveFrom)}
                  {h.setBy ? ` · set by ${h.setBy}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>

        {readOnly ? (
          <p className="mp-muted text-[0.875rem]">
            Only the Treasurer changes the fee. Every change is recorded in the audit log with who made it and when.
          </p>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-3">
            <div>
              <label htmlFor="fee-amount" className="ap-label">New fee (₱)</label>
              <input
                id="fee-amount"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={rules ? rules.amount.toFixed(2) : '0.00'}
                aria-describedby="fee-amount-hint"
                className="ap-input"
              />
              <p id="fee-amount-hint" className="ap-hint">
                Article III has the officers set the fee and the adviser approve it, so change it only once both have agreed. It applies from now: payments
                already recorded keep the fee they were made under, and everyone else is asked for the new amount. The public Join Us and Application pages update by themselves.
              </p>
            </div>
            {error && <p role="alert" className="mp-alert">{error}</p>}
            <button type="submit" disabled={save.isPending || !value.trim()} className="mp-btn mp-btn--primary w-full sm:w-auto">
              {save.isPending ? 'Saving…' : 'Change the fee'}
            </button>
          </form>
        )}
      </div>
    </Panel>
  );
}
