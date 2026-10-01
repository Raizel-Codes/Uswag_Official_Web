import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import type { AnnouncementNotification } from '@/types/post.types';
import NotificationRow from './NotificationRow';

// The bell in the portal headers: the latest notifications, newest first. The full list, with
// everything else, is /dashboard/notifications.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { notifications, unread, isLoading, isError, refetch, markAllRead, markRead } = useNotifications();
  const push = usePushSubscription();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Don't render bell for guests
  if (!user) return null;

  function openNotification(n: AnnouncementNotification) {
    if (!n.read) markRead.mutate(n.id);
    setOpen(false);
    if (n.url) navigate(n.url);
  }

  const canTurnOn = push.isSupported && !push.isSubscribed && !push.isLoading && Notification.permission !== 'denied';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative w-11 h-11 rounded-full bg-white shadow flex items-center justify-center transition-transform active:scale-95 hover:shadow-md"
      >
        <svg className="w-5 h-5 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && <span className="absolute top-[9px] right-[11px] w-2.5 h-2.5 rounded-full bg-danger border-2 border-white" aria-hidden="true" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-forest/20 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-label="Notifications"
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(20,39,24,0.15)] flex flex-col max-h-[72vh] max-w-md mx-auto md:bottom-auto md:top-20 md:right-6 md:left-auto md:w-96 md:rounded-[3px] md:shadow-2xl"
          >
            {/* Drag handle (mobile) */}
            <div className="w-10 h-1.5 bg-[rgb(20_39_24/0.15)] rounded-full mx-auto mt-3 mb-1 md:hidden" aria-hidden="true" />

            <div className="flex items-center justify-between px-5 py-3 border-b border-[rgb(20_39_24/0.1)]">
              <h3 className="font-heading font-bold text-[1.0625rem] text-forest">Notifications</h3>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="text-[0.8125rem] font-semibold text-primary hover:text-forest px-2 py-2 -mr-2 disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
            </div>

            {(canTurnOn || push.needsInstall || push.error) && (
              <div className="px-5 py-3 border-b border-[rgb(20_39_24/0.1)] bg-mist text-[0.8125rem] text-forest">
                {canTurnOn && (
                  <div className="flex items-center gap-3">
                    <p className="flex-1">Get these on this device, even when USWAG is closed.</p>
                    <button type="button" onClick={() => push.subscribe()} className="mp-btn mp-btn--primary mp-btn--sm shrink-0">Turn on</button>
                  </div>
                )}
                {push.needsInstall && <p>To get notifications on an iPhone, add USWAG to your Home Screen first (Share → Add to Home Screen).</p>}
                {push.error && <p role="alert" className="text-danger font-medium mt-1">{push.error}</p>}
              </div>
            )}

            <div className="overflow-y-auto uw-scroll p-2 flex-1 min-h-[7rem]">
              {isLoading ? (
                <div className="p-2 space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-14" />)}</div>
              ) : isError ? (
                <div className="text-center py-8 text-sm text-grey">
                  <p>We couldn’t load your notifications.</p>
                  <button type="button" onClick={() => refetch()} className="mp-btn mp-btn--ghost mp-btn--sm mt-3">Try again</button>
                </div>
              ) : notifications.length === 0 ? (
                <p className="text-center py-8 px-4 text-sm text-grey">Nothing yet. Announcements, new events and updates to your membership will appear here.</p>
              ) : (
                <ul>
                  {notifications.slice(0, 8).map((n) => (
                    <li key={n.id}><NotificationRow n={n} onOpen={openNotification} /></li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-5 py-3 border-t border-[rgb(20_39_24/0.1)] text-center">
              <Link to="/dashboard/notifications" onClick={() => setOpen(false)} className="text-[0.875rem] font-semibold text-primary hover:text-forest">
                See all notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
