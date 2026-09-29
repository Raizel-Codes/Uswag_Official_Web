import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listNotifications, markAllRead } from '@/services/notificationService';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useAuthContext } from '@/context/AuthContext';

// Bottom sheet — matches prototype/member.html's #notifSheet exactly:
// a bell button that opens a sheet with a scrollable item list and a single
// "Mark all read" action. There is no separate full-page inbox and no
// per-item read toggle in the prototype, so this stays the only surface.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const { isSupported, isSubscribed, subscribe } = usePushSubscription();
  const hasPromptedRef = useRef(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
    refetchInterval: 60000,
    // Only fetch when user is logged in
    enabled: !!user,
  });

  const markReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = notifications.filter(n => !n.read).length;

  // Auto-request push permission the first time the bell is opened
  useEffect(() => {
    if (open && user && isSupported && !isSubscribed && !hasPromptedRef.current) {
      hasPromptedRef.current = true;
      // Small delay so the dropdown is visible first
      setTimeout(() => {
        if (Notification.permission === 'default') {
          subscribe();
        }
      }, 800);
    }
  }, [open, user, isSupported, isSubscribed, subscribe]);

  // Don't render bell for guests
  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
        className="relative w-10 h-10 rounded-full bg-white shadow flex items-center justify-center transition-transform active:scale-95 hover:shadow-md"
      >
        <svg className="w-5 h-5 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute top-[8px] right-[10px] w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-forest/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(20,39,24,0.15)] flex flex-col max-h-[72vh] max-w-md mx-auto md:bottom-auto md:top-20 md:right-6 md:left-auto md:w-80 md:rounded-2xl md:shadow-2xl">
            {/* Drag handle (mobile) */}
            <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-1 md:hidden" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-heading font-bold text-[17px] text-forest">Notifications</h3>
              {unread > 0 && (
                <button
                  onClick={() => markReadMutation.mutate()}
                  disabled={markReadMutation.isPending}
                  className="text-[11.5px] font-bold text-primary hover:text-forest transition-colors disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification list — full scrollable list, no pagination/cap */}
            <div className="overflow-y-auto uw-scroll p-4 space-y-2 flex-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">No notifications yet.</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`p-4 rounded-2xl flex gap-3 ${n.read ? 'bg-transparent' : 'bg-mist'}`}>
                    <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm text-primary">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold text-[13px] leading-tight mb-0.5 ${n.read ? 'text-gray-600' : 'text-forest'}`}>{n.title}</p>
                      <p className="text-[12px] text-gray-500 leading-snug">{n.body}</p>
                      <span className="text-[10px] text-gray-400 mt-1.5 block">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
