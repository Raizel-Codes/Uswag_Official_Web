import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/context/AuthContext';
import { listNotifications, markAllRead, markRead } from '@/services/notificationService';

const KEY = ['notifications'];

/** The signed-in person's inbox: the bell and the notifications page share this one query. */
export function useNotifications() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: KEY });

  const query = useQuery({
    queryKey: KEY,
    queryFn: listNotifications,
    enabled: !!user,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const readAll = useMutation({ mutationFn: markAllRead, onSuccess: refresh });
  const readOne = useMutation({ mutationFn: markRead, onSuccess: refresh });

  const notifications = query.data ?? [];
  return {
    notifications,
    unread: notifications.filter((n) => !n.read).length,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    markAllRead: readAll,
    markRead: readOne,
  };
}
