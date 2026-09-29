// Member portal — Events. RSVP to in-campus events; apply for out-of-campus ones (limited
// slots, recorded as "applied" for the officers to confirm). Sign-ups come from the server
// (GET /events/me/rsvps), so "Going ✓" survives a reload. Only active members can sign up —
// everyone else sees the events with the action locked and the reason above the list.
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEvents } from '@/hooks/useEvents';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useMyRsvps } from '@/hooks/useMyRsvps';
import type { UswagEvent } from '@/types/event.types';
import PageHeader from '@/components/portal/PageHeader';
import StandingNote from '@/components/member/StandingNote';
import EventRow from '@/components/member/EventRow';
import { isActive, errorMessage } from '@/components/member/standing';

type Filter = 'upcoming' | 'mine' | 'past';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'mine', label: 'My sign-ups' },
  { key: 'past', label: 'Past' },
];

function ApplyDialog({ event, busy, error, onClose, onConfirm }: { event: UswagEvent; busy: boolean; error?: string; onClose: () => void; onConfirm: () => void }) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // Focus the confirm button once on open (not on every re-render); Escape closes.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-[rgb(20_39_24/0.45)]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-title"
        className="mp-card w-full max-w-md p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mp-eyebrow">Out of campus · Limited slots</p>
        <h2 id="apply-title" className="mp-h1 mt-2" style={{ fontSize: '1.375rem' }}>{event.title}</h2>
        {event.description && <p className="mp-muted mt-3 text-[0.9375rem] leading-relaxed">{event.description}</p>}
        <div className="mp-note mp-note--warn mt-5 text-[0.875rem]">
          <p>
            {event.limitedSlots ? <>This event has <strong>{event.limitedSlots}</strong> slots. </> : null}
            Applying doesn’t guarantee a slot; the officers confirm who goes, with priority by attendance standing.
          </p>
        </div>
        {error && <p role="alert" className="mp-alert mt-4">{error}</p>}
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose} className="mp-btn mp-btn--ghost flex-1">Cancel</button>
          <button ref={confirmRef} type="button" onClick={onConfirm} disabled={busy} className="mp-btn mp-btn--primary flex-1">
            {busy ? 'Applying…' : 'Apply for a slot'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MemberEventsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: events, isLoading, isError } = useEvents();
  const { data: profile } = useMyProfile();
  const active = isActive(profile?.status);
  const { byEvent, rsvp } = useMyRsvps(active);
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [applyTarget, setApplyTarget] = useState<UswagEvent | null>(null);

  // Home's "Apply" on an out-of-campus event lands here with the dialog open.
  const applyId = (location.state as { apply?: string } | null)?.apply;
  useEffect(() => {
    if (!applyId || !events || !active) return;
    const ev = events.find((e) => e.id === applyId);
    if (ev) setApplyTarget(ev);
    navigate(location.pathname, { replace: true, state: null });
  }, [applyId, events, active, navigate, location.pathname]);

  const all = events ?? [];
  const byDate = (a: UswagEvent, b: UswagEvent) => +new Date(a.startsAt) - +new Date(b.startsAt);
  // An event is past once it's completed/cancelled or its date has gone by (with a few hours'
  // grace for events still running) — same rule as Home's "Coming up".
  const cutoff = Date.now() - 6 * 3600_000;
  const isPast = (e: UswagEvent) => e.status === 'COMPLETED' || e.status === 'CANCELLED' || +new Date(e.startsAt) < cutoff;
  const lists: Record<Filter, UswagEvent[]> = {
    upcoming: all.filter((e) => !isPast(e)).sort(byDate),
    mine: all.filter((e) => byEvent.has(e.id)).sort(byDate),
    past: all.filter(isPast).sort((a, b) => byDate(b, a)),
  };
  const shown = lists[filter];

  function act(event: UswagEvent) {
    rsvp.reset();
    if (event.scope === 'OUT_OF_CAMPUS') setApplyTarget(event);
    else rsvp.mutate(event.id);
  }

  return (
    <div className="mp-page space-y-8">
      <PageHeader
        eyebrow="Events"
        title="What’s on"
        lead="RSVP to campus events. Out-of-campus activities have limited slots, so you apply and the officers confirm."
      />

      {profile && !active && <StandingNote profile={profile} what="Signing up is for active members" />}

      <div role="group" aria-label="Show" className="flex gap-2 overflow-x-auto uw-scroll-hidden -mx-1 px-1 pb-1">
        {FILTERS.filter((f) => f.key !== 'mine' || active).map((f) => (
          <button key={f.key} type="button" className="mp-chip" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
            {f.label}
            {f.key === 'mine' && byEvent.size > 0 ? ` · ${byEvent.size}` : ''}
          </button>
        ))}
      </div>

      {rsvp.isError && !applyTarget && (
        <p role="alert" className="mp-alert">{errorMessage(rsvp.error, 'Could not save your RSVP. Please try again.')}</p>
      )}

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-24" />)}
        </div>
      ) : isError ? (
        <p role="alert" className="mp-alert">We couldn’t load events. Refresh the page to try again.</p>
      ) : shown.length === 0 ? (
        <p className="mp-card p-8 text-center mp-muted">
          {filter === 'mine' ? 'You haven’t signed up for anything yet.' : filter === 'past' ? 'No past events yet.' : 'No upcoming events yet. Check back soon.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {shown.map((e) => (
            <EventRow
              key={e.id}
              event={e}
              rsvp={byEvent.get(e.id)}
              locked={!active}
              busy={rsvp.isPending && rsvp.variables === e.id}
              onAction={act}
            />
          ))}
        </ul>
      )}

      {applyTarget && (
        <ApplyDialog
          event={applyTarget}
          busy={rsvp.isPending}
          error={rsvp.isError ? errorMessage(rsvp.error, 'Could not send your application. Please try again.') : undefined}
          onClose={() => {
            setApplyTarget(null);
            rsvp.reset();
          }}
          onConfirm={() => rsvp.mutate(applyTarget.id, { onSuccess: () => setApplyTarget(null) })}
        />
      )}
    </div>
  );
}
