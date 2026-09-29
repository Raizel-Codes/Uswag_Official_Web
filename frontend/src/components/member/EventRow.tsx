import { PILLAR_LABELS, type UswagEvent, type MyRsvp } from '@/types/event.types';
import LockGlyph from '@/components/portal/LockGlyph';

function dateParts(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getDate(),
    month: d.toLocaleString('en-PH', { month: 'short' }),
    time: d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }),
    weekday: d.toLocaleString('en-PH', { weekday: 'short' }),
  };
}

interface EventRowProps {
  event: UswagEvent;
  /** This member's RSVP for the event, if any. */
  rsvp?: MyRsvp['status'];
  /** Not an active member: the action is replaced by a lock (the reason is shown on the page). */
  locked: boolean;
  busy?: boolean;
  onAction?: (event: UswagEvent) => void;
}

/** One event as an engraved plate: date tile · details · the member's action. */
export default function EventRow({ event, rsvp, locked, busy, onAction }: EventRowProps) {
  const dt = dateParts(event.startsAt);
  const outOfCampus = event.scope === 'OUT_OF_CAMPUS';
  // Ended = completed / cancelled, or its date has passed (a few hours' grace while it runs)
  const ended = +new Date(event.startsAt) < Date.now() - 6 * 3600_000;
  const finished = event.status === 'COMPLETED' || event.status === 'CANCELLED' || ended;

  let action;
  if (finished) {
    action = (
      <span className="mp-muted text-[0.8125rem] font-semibold">
        {event.status === 'CANCELLED' ? 'Cancelled' : event.status === 'COMPLETED' ? 'Completed' : 'Ended'}
      </span>
    );
  } else if (rsvp) {
    action = (
      <span className="mp-btn mp-btn--done mp-btn--sm" role="status">
        {rsvp === 'applied' ? 'Applied ✓' : rsvp === 'waitlisted' ? 'Waitlisted' : 'Going ✓'}
      </span>
    );
  } else if (locked) {
    action = (
      <span className="inline-flex items-center gap-1.5 mp-muted text-[0.8125rem] font-semibold">
        <LockGlyph className="w-3.5 h-3.5" />
        Active members only
      </span>
    );
  } else {
    action = (
      <button
        type="button"
        disabled={busy}
        onClick={() => onAction?.(event)}
        className={`mp-btn mp-btn--sm ${outOfCampus ? 'mp-btn--ghost' : 'mp-btn--primary'}`}
      >
        {busy ? 'Saving…' : outOfCampus ? 'Apply' : 'RSVP'}
        <span className="mp-sr-only"> for {event.title}</span>
      </button>
    );
  }

  return (
    <li className={`mp-card mp-lift p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${finished ? 'opacity-80' : ''}`}>
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="mp-plate w-14 h-16 shrink-0 flex flex-col items-center justify-center" aria-hidden="true">
          <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-sage">{dt.month}</span>
          <span className="mp-num text-[1.5rem] font-bold leading-none mt-0.5">{dt.day}</span>
        </div>
        <div className="min-w-0">
          <p className="mp-eyebrow" style={{ fontSize: '0.6875rem' }}>
            {PILLAR_LABELS[event.pillar] ?? event.pillar}
            {outOfCampus && <> · Out of campus{event.limitedSlots ? ` · ${event.limitedSlots} slots` : ''}</>}
          </p>
          <h3 className="mp-h3 mt-1 truncate">{event.title}</h3>
          <p className="mp-muted text-[0.875rem] mt-0.5 truncate">
            <time dateTime={event.startsAt}>
              {dt.weekday}, {dt.month} {dt.day} · {dt.time}
            </time>{' '}
            · {event.location}
          </p>
        </div>
      </div>
      <div className="sm:shrink-0 sm:text-right pl-[4.5rem] sm:pl-0">{action}</div>
    </li>
  );
}
