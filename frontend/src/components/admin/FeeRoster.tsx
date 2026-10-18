import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { extendApplication, getFeeRoster } from '@/services/financeService';
import type { FeeRoster as FeeRosterData, FeeRosterMember } from '@/types/finance.types';
import Panel from '@/components/portal/Panel';
import { apiError, initials } from '@/components/admin/format';
import { FEE_LABEL, FEE_TONE, daysUntil, feeDetail } from '@/components/admin/fee';

type View = 'owes' | 'paid' | 'all';

const owes = (m: FeeRosterMember) => m.fee.state === 'unpaid' || m.fee.state === 'partial' || m.fee.state === 'overdue';

/**
 * Who has and hasn't paid the membership fee. Unpaid applications show the day they are removed
 * (after 7 days with no payment) and the Treasurer can give them more time, e.g. for a cash payment
 * not yet written down. The Auditor sees the same list, read-only.
 */
export default function FeeRoster({ readOnly = false, onMessage }: { readOnly?: boolean; onMessage: (message: string, ok?: boolean) => void }) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery<FeeRosterData>({ queryKey: ['finance', 'roster'], queryFn: getFeeRoster, staleTime: 30_000 });
  const [view, setView] = useState<View>('owes');

  const extend = useMutation({
    mutationFn: (m: FeeRosterMember) => extendApplication(m.id),
    onSuccess: (_r, m) => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'roster'] });
      onMessage(`${m.name} has ${data?.rules.extensionDays ?? 7} more days`);
    },
    onError: (err) => onMessage(apiError(err, 'Could not give more time. Please try again.'), false),
  });

  const members = data?.members ?? [];
  const counts = { owes: members.filter(owes).length, paid: members.filter((m) => m.fee.state === 'paid' || m.fee.state === 'exempt').length, all: members.length };
  const shown = members.filter((m) => (view === 'owes' ? owes(m) : view === 'paid' ? !owes(m) : true));
  const tabs: { key: View; label: string }[] = [
    { key: 'owes', label: 'Hasn’t paid' },
    { key: 'paid', label: 'Paid' },
    { key: 'all', label: 'Everyone' },
  ];

  return (
    <section id="fee-roster" aria-labelledby="fee-roster-title" className="scroll-mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 id="fee-roster-title" className="mp-h2 flex-1">Membership fee</h2>
        <div role="group" aria-label="Show" className="flex gap-2">
          {tabs.map((t) => (
            <button key={t.key} type="button" onClick={() => setView(t.key)} aria-pressed={view === t.key} className={`mp-btn mp-btn--sm ${view === t.key ? 'mp-btn--primary' : 'mp-btn--ghost'}`}>
              {t.label}
              {data && <span className="ml-1.5 opacity-75">{counts[t.key]}</span>}
            </button>
          ))}
        </div>
      </div>

      <Panel flush>
        {isLoading ? (
          <div className="p-5 space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-12" />)}</div>
        ) : isError ? (
          <div className="p-6 space-y-3">
            <p role="alert" className="mp-alert">The member list didn’t load.</p>
            <button type="button" onClick={() => refetch()} className="mp-btn mp-btn--ghost">Try again</button>
          </div>
        ) : shown.length === 0 ? (
          <p className="p-8 mp-muted text-center">
            {view === 'owes' ? 'Everyone has paid. Nothing to follow up.' : 'Nobody here yet.'}
          </p>
        ) : (
          <ul className="ap-list max-h-[520px] overflow-y-auto uw-scroll">
            {shown.map((m) => (
              <li key={m.id} className="ap-row items-start flex-wrap sm:flex-nowrap">
                <span className="ap-avatar" aria-hidden="true">{initials(m.name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{m.name}</p>
                  <p className="mp-muted text-[0.8125rem] sm:truncate">
                    {m.collegeOrDept}
                    {m.status === 'pending' ? ' · applying' : m.status === 'expired' ? ' · expired' : ''}
                  </p>
                  <p className="mp-muted text-[0.8125rem]">{feeDetail({ ...m.fee, removedOn: m.removedOn })}</p>
                </div>
                <div className="flex items-center gap-3 w-full pl-[3.375rem] sm:w-auto sm:pl-0 shrink-0">
                  <span className={`mp-standing ${FEE_TONE[m.fee.state]}`}>{FEE_LABEL[m.fee.state]}</span>
                  {!readOnly && m.removedOn && (
                    <button type="button" disabled={extend.isPending} onClick={() => extend.mutate(m)} className="mp-btn mp-btn--ghost mp-btn--sm">
                      +{data?.rules.extensionDays ?? 7} days<span className="mp-sr-only"> for {m.name}, now removed in {daysUntil(m.removedOn)} days</span>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {data && (
        <p className="mp-muted text-[0.8125rem]">
          The fee is ₱{data.rules.amount}. A part payment gives {data.rules.partialMonths} months to pay the rest, then the membership returns to pending. An application with no payment is removed after {data.rules.applicantDays} days. Serving officers pay no fee.
        </p>
      )}
    </section>
  );
}
