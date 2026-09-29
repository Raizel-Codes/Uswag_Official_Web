import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listMyRsvps, rsvpToEvent } from '@/services/eventService';
import type { MyRsvp } from '@/types/event.types';

/**
 * The member's own sign-ups, plus the mutation that adds one. Only fetched for an active
 * member (`enabled`) — nobody else can have any, and the server would refuse the RSVP.
 */
export function useMyRsvps(enabled: boolean) {
  const queryClient = useQueryClient();
  const query = useQuery<MyRsvp[]>({
    queryKey: ['member', 'rsvps'],
    queryFn: listMyRsvps,
    enabled,
    staleTime: 60 * 1000,
  });
  const rsvp = useMutation({
    mutationFn: (eventId: string) => rsvpToEvent(eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['member', 'rsvps'] }),
  });
  const byEvent = new Map((query.data ?? []).map((r) => [r.eventId, r.status] as const));
  return { ...query, byEvent, rsvp };
}
