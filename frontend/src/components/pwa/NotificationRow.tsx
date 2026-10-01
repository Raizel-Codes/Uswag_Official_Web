import type { AnnouncementNotification } from '@/types/post.types';

// One notification — in the bell's dropdown and on the notifications page. A real button: it marks
// the notification read and opens where it points (the caller decides how).

const ICONS: Record<string, string> = {
  announcement: 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Zm13.5 1a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4Z',
  event: 'M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  membership: 'M12 3 4 6v6c0 4.5 3.2 7.7 8 9 4.8-1.3 8-4.5 8-9V6l-8-3Zm-3 9 2.2 2.2L15.5 10',
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function NotificationRow({ n, onOpen }: { n: AnnouncementNotification; onOpen: (n: AnnouncementNotification) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={`w-full text-left p-4 rounded-[3px] flex gap-3 items-start transition-colors hover:bg-mist focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${n.read ? '' : 'bg-mist'}`}
    >
      <span className="w-9 h-9 rounded-[3px] bg-white border border-[rgb(20_39_24/0.15)] flex items-center justify-center shrink-0 text-primary" aria-hidden="true">
        <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={ICONS[n.kind] ?? ICONS.announcement} />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span className={`block text-[0.9375rem] leading-snug ${n.read ? 'font-medium text-grey' : 'font-semibold text-forest'}`}>{n.title}</span>
          {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden="true" />}
        </span>
        <span className="block text-[0.875rem] text-grey leading-snug mt-0.5">{n.body}</span>
        <span className="block text-[0.75rem] text-grey mt-1.5">
          <time dateTime={n.createdAt}>{formatWhen(n.createdAt)}</time>
          {!n.read && <span className="mp-sr-only"> (unread)</span>}
        </span>
      </span>
    </button>
  );
}
