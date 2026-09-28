import { useQuery } from '@tanstack/react-query';
import * as notificationService from '@/services/notificationService';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.listNotifications,
    refetchInterval: 60_000, // poll every minute; swap for push-driven invalidation later
  });
}
