import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as eventService from '@/services/eventService';

export function useEvents() {
  return useQuery({ queryKey: ['events'], queryFn: eventService.listEvents });
}

export function useRsvp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => eventService.rsvpToEvent(eventId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
}
