import { useQuery } from '@tanstack/react-query';
import { listResetRequests } from '@/services/memberService';
import type { ResetRequest } from '@/types/member.types';

export const RESET_REQUESTS_KEY = ['reset-requests'];

/** Open "I can't sign in" requests this officer may act on (the server decides which; see resetRequest.service.ts). */
export function useResetRequests() {
  return useQuery<ResetRequest[]>({ queryKey: RESET_REQUESTS_KEY, queryFn: listResetRequests, staleTime: 30_000, refetchInterval: 60_000 });
}
