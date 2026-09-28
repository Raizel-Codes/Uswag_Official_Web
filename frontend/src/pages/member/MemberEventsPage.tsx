import { useState } from "react";
import { useEvents, useRsvp } from "@/hooks/useEvents";
import { PILLAR_LABELS } from "@/types/event.types";
import type { UswagEvent } from "@/types/event.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getDate().toString().padStart(2, "0"),
    month: d.toLocaleString("default", { month: "short" }).toUpperCase(),
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

const PILLAR_COLORS: Record<string, string> = {
  YOUTH_VOICE: "text-blue-600",
  MENTAL_HEALTH: "text-rose-600",
  ENVIRONMENTAL: "text-green-700",
};

// ---------------------------------------------------------------------------
// Skeletons
// ---------------------------------------------------------------------------
function EventCardSkeleton() {
  return (
    <div className="mb-3 flex gap-3 rounded-2xl bg-white p-3 shadow-sm border-l-4 border-sage animate-pulse">
      <div className="h-12 w-12 shrink-0 rounded-xl bg-mist" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 w-20 rounded bg-gray-200" />
        <div className="h-3.5 w-40 rounded bg-gray-200" />
        <div className="h-2.5 w-32 rounded bg-gray-100" />
      </div>
      <div className="h-7 w-16 shrink-0 rounded-full bg-mist" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// EventCard
// ---------------------------------------------------------------------------
interface EventCardProps {
  event: UswagEvent;
  isGoing: boolean;
  isPending: boolean;
  onRsvp: (id: string) => void;
  onApply: (id: string) => void;
}

function EventCard({ event, isGoing, isPending, onRsvp, onApply }: EventCardProps) {
  const dt = formatDate(event.startsAt);
  const isOutOfCampus = event.scope === "OUT_OF_CAMPUS";
  const borderColor = isOutOfCampus ? "border-amber-400" : "border-sage";
  const isPast = event.status === "COMPLETED" || event.status === "CANCELLED";

  return (
    <div
      className={
        "mb-3 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm border-l-4 transition-shadow hover:shadow-md " +
        borderColor +
        (isPast ? " opacity-60" : "")
      }
    >
      {/* Date */}
      <div className="flex h-12 min-w-12 flex-col items-center justify-center rounded-xl bg-mist font-heading text-primary">
        <span className="text-[17px] font-extrabold leading-none">{dt.day}</span>
        <span className="text-[9.5px] font-bold uppercase tracking-wide">{dt.month}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div
          className={
            "text-[9.5px] font-bold uppercase tracking-widest " +
            (PILLAR_COLORS[event.pillar] ?? "text-primary")
          }
        >
          {PILLAR_LABELS[event.pillar]}
          {isOutOfCampus && <span className="ml-1 text-amber-600">&middot; Limited</span>}
        </div>
        <h4 className="font-heading mt-0.5 truncate text-[13.5px] font-bold text-forest">{event.title}</h4>
        <div className="mt-0.5 truncate text-[11.5px] text-gray-500">
          {event.location} &middot; {dt.time}
        </div>
      </div>

      {/* Action button */}
      {!isPast && (
        <button
          id={"btn-event-" + (isOutOfCampus ? "apply" : "rsvp") + "-" + event.id}
          disabled={isGoing || isPending}
          onClick={() => (isOutOfCampus ? onApply(event.id) : onRsvp(event.id))}
          className={
            "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors focus:outline-none " +
            (isGoing
              ? "bg-primary text-white cursor-default"
              : isPending
              ? "bg-mist text-primary/50 cursor-wait"
              : isOutOfCampus
              ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-500 hover:text-white hover:border-transparent"
              : "bg-mist text-primary hover:bg-primary hover:text-white")
          }
        >
          {isGoing ? "Going \u2713" : isPending ? "\u2026" : isOutOfCampus ? "Apply" : "RSVP"}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Apply modal for out-of-campus events
// ---------------------------------------------------------------------------
function ApplyModal({
  event,
  onClose,
  onConfirm,
  isPending,
}: {
  event: UswagEvent;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-600">
          Out-of-Campus &middot; Limited Slots
        </div>
        <h3 className="font-heading text-[17px] font-bold text-forest">{event.title}</h3>
        <p className="mt-2 text-[12.5px] text-gray-600 leading-relaxed">{event.description}</p>
        {event.limitedSlots != null && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 stroke-amber-600">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-[11.5px] text-amber-700 font-medium">
              This event has <strong>{event.limitedSlots}</strong> slots. Slots are prioritized by attendance standing.
            </p>
          </div>
        )}
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-2xl border border-gray-200 bg-white py-3 text-[13px] font-bold text-forest hover:bg-mist"
          >
            Cancel
          </button>
          <button
            id="btn-confirm-apply"
            disabled={isPending}
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-amber-500 py-3 text-[13px] font-bold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {isPending ? "Applying\u2026" : "Confirm Application"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function MemberEventsPage() {
  const { data: events, isLoading } = useEvents();
  const rsvpMutation = useRsvp();
  const [rsvpedIds, setRsvpedIds] = useState<Set<string>>(new Set());
  const [applyTarget, setApplyTarget] = useState<UswagEvent | null>(null);

  function handleRsvp(eventId: string) {
    rsvpMutation.mutate(eventId, {
      onSuccess: () => setRsvpedIds((prev) => new Set(prev).add(eventId)),
    });
  }

  function handleApply(event: UswagEvent) {
    setApplyTarget(event);
  }

  function confirmApply() {
    if (!applyTarget) return;
    rsvpMutation.mutate(applyTarget.id, {
      onSuccess: () => {
        setRsvpedIds((prev) => new Set(prev).add(applyTarget.id));
        setApplyTarget(null);
      },
      onError: () => setApplyTarget(null),
    });
  }

  const upcoming = (events ?? [])
    .filter((e) => e.status !== "COMPLETED" && e.status !== "CANCELLED")
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const thisMonth = upcoming.filter((e) => {
    const evMonth = new Date(e.startsAt).getMonth();
    return evMonth === new Date().getMonth();
  });

  const later = upcoming.filter((e) => {
    const evMonth = new Date(e.startsAt).getMonth();
    return evMonth !== new Date().getMonth();
  });

  const outOfCampus = upcoming.filter((e) => e.scope === "OUT_OF_CAMPUS");

  const past = (events ?? [])
    .filter((e) => e.status === "COMPLETED")
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-mist pb-24 md:pb-8">
      <div className="px-5 pt-6 pb-2">
        <h1 className="font-heading text-[19px] font-bold text-forest">Events</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">RSVP and track your participation</p>
      </div>

      <div className="px-5 pt-3">
        {/* This Month */}
        <div className="my-4 flex items-center justify-between">
          <h3 className="font-heading text-[15px] font-bold text-forest">This Month</h3>
        </div>
        {isLoading ? (
          <><EventCardSkeleton /><EventCardSkeleton /></>
        ) : thisMonth.length === 0 ? (
          <div className="mb-4 rounded-2xl bg-white p-6 text-center shadow-sm border border-gray-100">
            <p className="text-[12.5px] text-gray-500">No events this month.</p>
          </div>
        ) : (
          thisMonth.filter((e) => e.scope === "IN_CAMPUS").map((e) => (
            <EventCard
              key={e.id}
              event={e}
              isGoing={rsvpedIds.has(e.id)}
              isPending={rsvpMutation.isPending && rsvpMutation.variables === e.id}
              onRsvp={handleRsvp}
              onApply={() => handleApply(e)}
            />
          ))
        )}

        {/* Later this year */}
        {!isLoading && later.filter((e) => e.scope === "IN_CAMPUS").length > 0 && (
          <>
            <div className="my-4 flex items-center justify-between">
              <h3 className="font-heading text-[15px] font-bold text-forest">Coming Up</h3>
            </div>
            {later.filter((e) => e.scope === "IN_CAMPUS").map((e) => (
              <EventCard
                key={e.id}
                event={e}
                isGoing={rsvpedIds.has(e.id)}
                isPending={rsvpMutation.isPending && rsvpMutation.variables === e.id}
                onRsvp={handleRsvp}
                onApply={() => handleApply(e)}
              />
            ))}
          </>
        )}

        {/* Out-of-Campus */}
        {(isLoading || outOfCampus.length > 0) && (
          <>
            <div className="my-4 flex items-center justify-between">
              <h3 className="font-heading text-[15px] font-bold text-forest">Out-of-Campus</h3>
              <span className="text-[11px] font-semibold text-amber-600">
                Limited slots &middot; apply to join
              </span>
            </div>
            {isLoading ? (
              <EventCardSkeleton />
            ) : (
              outOfCampus.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  isGoing={rsvpedIds.has(e.id)}
                  isPending={rsvpMutation.isPending && rsvpMutation.variables === e.id}
                  onRsvp={handleRsvp}
                  onApply={() => handleApply(e)}
                />
              ))
            )}
          </>
        )}

        {/* Past */}
        {past.length > 0 && (
          <>
            <div className="my-4 flex items-center justify-between">
              <h3 className="font-heading text-[15px] font-bold text-forest">Past Events</h3>
            </div>
            {past.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                isGoing={false}
                isPending={false}
                onRsvp={() => {}}
                onApply={() => {}}
              />
            ))}
          </>
        )}

        {/* RSVP error */}
        {rsvpMutation.isError && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600">
            Could not process your RSVP. Please try again.
          </div>
        )}

        <div className="h-4" />
      </div>

      {/* Apply modal */}
      {applyTarget && (
        <ApplyModal
          event={applyTarget}
          onClose={() => setApplyTarget(null)}
          onConfirm={confirmApply}
          isPending={rsvpMutation.isPending}
        />
      )}
    </div>
  );
}
