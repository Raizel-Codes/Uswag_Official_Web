// Notifications — the full inbox (the bell shows the latest few). Shared by members and officers:
// PortalLayout gives each their own shell. Whether this device also gets push is the switch on
// the Profile page; this page just says which it is.
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import PageHeader from '@/components/portal/PageHeader';
import NotificationRow from '@/components/pwa/NotificationRow';
import type { AnnouncementNotification } from '@/types/post.types';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unread, isLoading, isError, refetch, markAllRead, markRead } = useNotifications();
  const push = usePushSubscription();

  function open(n: AnnouncementNotification) {
    if (!n.read) markRead.mutate(n.id);
    if (n.url) navigate(n.url);
  }

  return (
    <div className="mp-page space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        lead="Announcements from your officers, new events, and changes to your membership."
        actions={
          unread > 0 ? (
            <button type="button" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending} className="mp-btn mp-btn--ghost mp-btn--sm">
              Mark all read · {unread}
            </button>
          ) : undefined
        }
      />

      <p className="mp-muted text-[0.875rem]" aria-live="polite">
        {push.isLoading
          ? ' '
          : push.isSubscribed
            ? 'Notifications are on for this device. '
            : push.needsInstall
              ? 'To get notifications on an iPhone, add USWAG to your Home Screen first. '
              : push.isSupported
                ? 'Notifications are off for this device. '
                : 'This browser can’t show notifications from USWAG, so they appear here only. '}
        {(push.isSupported || push.isSubscribed) && (
          <Link to="/dashboard/profile" className="font-semibold text-primary underline underline-offset-4">Change this in your profile</Link>
        )}
      </p>

      <section aria-label="Your notifications" className="mp-card p-2 sm:p-3">
        {isLoading ? (
          <div className="p-3 space-y-3" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="mp-skeleton h-16" />)}</div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="mp-muted">We couldn’t load your notifications.</p>
            <button type="button" onClick={() => refetch()} className="mp-btn mp-btn--ghost mp-btn--sm mt-4">Try again</button>
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-center py-12 px-6 mp-muted">Nothing yet. Announcements, new events and updates to your membership will appear here.</p>
        ) : (
          <ul className="divide-y divide-[rgb(20_39_24/0.08)]">
            {notifications.map((n) => (
              <li key={n.id}><NotificationRow n={n} onOpen={open} /></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
