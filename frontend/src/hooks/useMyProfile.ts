import { useQuery } from '@tanstack/react-query';
import { getMyProfile } from '@/services/memberService';
import type { MemberProfile } from '@/types/member.types';

/** The signed-in member's profile, including their standing (status + standingNote). */
export function useMyProfile() {
  return useQuery<MemberProfile>({
    queryKey: ['member', 'profile'],
    queryFn: getMyProfile,
    staleTime: 5 * 60 * 1000,
  });
}
