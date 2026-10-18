import { useQuery } from '@tanstack/react-query';
import { getMembershipFee } from '@/services/financeService';
import { formatCurrency } from '@/utils/formatters';

/**
 * The membership fee as the Treasurer has set it (public endpoint, no sign-in). Pages that quote the fee use
 * this instead of a typed-in amount, so a change on the Treasurer's Finance page shows up on the next load,
 * or within a minute on a page that is already open.
 *
 * `label` is null until the server has answered (or if it can't be reached): callers word the sentence
 * without a number rather than show one that might be out of date.
 */
export function useMembershipFee() {
  const { data } = useQuery({ queryKey: ['membership-fee'], queryFn: getMembershipFee, staleTime: 30_000, refetchInterval: 60_000, retry: 1 });
  return { amount: data?.amount ?? null, label: data ? formatCurrency(data.amount) : null };
}
