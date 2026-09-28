import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { listEvents, createEvent } from "@/services/eventService";
import type { CreateEventPayload } from "@/services/eventService";
import { PILLAR_LABELS, STATUS_LABELS } from "@/types/event.types";
import type { UswagEvent } from "@/types/event.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: "bg-green-50 text-green-700",
  DRAFT: "bg-amber-50 text-amber-700",
  COMPLETED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-red-50 text-red-500",
};

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Create Event Form
// ---------------------------------------------------------------------------
const EMPTY_FORM: CreateEventPayload = {
  title: "",
  description: "",
  pillar: "YOUTH_VOICE",
  scope: "IN_CAMPUS",
  location: "",
  startsAt: "",
  limitedSlots: null,
};

function CreateEventForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState<CreateEventPayload>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: CreateEventPayload) => createEvent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setForm(EMPTY_FORM);
      setFormError(null);
      onCreated();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to create event";
      setFormError(msg);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim()) return setFormError("Event title is required.");
    if (!form.location.trim()) return setFormError("Location is required.");
    if (!form.startsAt) return setFormError("Date & time is required.");
    if (!form.description.trim()) return setFormError("Description is required.");

    const payload: CreateEventPayload = {
      ...form,
      // Convert local datetime-local value to ISO string
      startsAt: new Date(form.startsAt).toISOString(),
      limitedSlots:
        form.scope === "OUT_OF_CAMPUS" && form.limitedSlots
          ? Number(form.limitedSlots)
          : null,
    };
    mutation.mutate(payload);
  }

  const isOutOfCampus = form.scope === "OUT_OF_CAMPUS";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Title */}
      <div>
        <label className="mb-1 block text-[11.5px] font-bold text-gray-600">Event Title</label>
        <input
          id="input-event-title"
          type="text"
          placeholder="e.g. Coastal Cleanup Drive"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] text-forest shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Pillar */}
      <div>
        <label className="mb-1 block text-[11.5px] font-bold text-gray-600">Advocacy Pillar</label>
        <select
          id="select-event-pillar"
          value={form.pillar}
          onChange={(e) => setForm({ ...form, pillar: e.target.value as CreateEventPayload["pillar"] })}
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] text-forest shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="YOUTH_VOICE">Youth Voice &amp; Participation</option>
          <option value="MENTAL_HEALTH">Mental Health &amp; Wellness</option>
          <option value="ENVIRONMENTAL">Environmental Leadership</option>
        </select>
      </div>

      {/* Type / Scope */}
      <div>
        <label className="mb-1 block text-[11.5px] font-bold text-gray-600">Type</label>
        <select
          id="select-event-scope"
          value={form.scope}
          onChange={(e) => setForm({ ...form, scope: e.target.value as CreateEventPayload["scope"], limitedSlots: null })}
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] text-forest shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="IN_CAMPUS">In-Campus</option>
          <option value="OUT_OF_CAMPUS">Out-of-Campus (limited slots)</option>
        </select>
      </div>

      {/* Limited slots — only when out-of-campus */}
      {isOutOfCampus && (
        <div>
          <label className="mb-1 block text-[11.5px] font-bold text-gray-600">Number of Slots</label>
          <input
            id="input-event-slots"
            type="number"
            min={1}
            placeholder="e.g. 30"
            value={form.limitedSlots ?? ""}
            onChange={(e) => setForm({ ...form, limitedSlots: e.target.value ? Number(e.target.value) : null })}
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] text-forest shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}

      {/* Date & time */}
      <div>
        <label className="mb-1 block text-[11.5px] font-bold text-gray-600">Date &amp; Time</label>
        <input
          id="input-event-date"
          type="datetime-local"
          value={form.startsAt}
          onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] text-forest shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Location */}
      <div>
        <label className="mb-1 block text-[11.5px] font-bold text-gray-600">Location</label>
        <input
          id="input-event-location"
          type="text"
          placeholder="e.g. Gymnasium, NwSSU Main Campus"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] text-forest shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Description */}
      <div>
        <label className="mb-1 block text-[11.5px] font-bold text-gray-600">Description</label>
        <textarea
          id="input-event-description"
          rows={3}
          placeholder="What is this event about?"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[13px] text-forest shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Error */}
      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
          {formError}
        </div>
      )}

      {/* Submit */}
      <button
        id="btn-publish-event"
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-2xl bg-primary py-3.5 text-[13px] font-bold text-white transition-colors hover:bg-primary-light disabled:opacity-50 focus:outline-none"
      >
        {mutation.isPending ? "Publishing\u2026" : "Publish Event"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Events Table
// ---------------------------------------------------------------------------
function EventsTable({ events }: { events: UswagEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm border border-gray-100">
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2 h-8 w-8 stroke-gray-300">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p className="text-[12.5px] text-gray-500">No events yet. Create one using the form.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl shadow-sm">
      <table className="min-w-full bg-white text-[12.5px]">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th className="px-4 py-3 font-bold text-gray-600 text-[11px] uppercase tracking-wide">Event</th>
            <th className="px-4 py-3 font-bold text-gray-600 text-[11px] uppercase tracking-wide">Date</th>
            <th className="hidden px-4 py-3 font-bold text-gray-600 text-[11px] uppercase tracking-wide md:table-cell">RSVPs</th>
            <th className="px-4 py-3 font-bold text-gray-600 text-[11px] uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr
              key={event.id}
              className={
                "border-b border-gray-50 transition-colors hover:bg-mist " +
                (event.status === "COMPLETED" || event.status === "CANCELLED" ? "opacity-55" : "")
              }
            >
              <td className="px-4 py-3">
                <div className="font-bold text-forest truncate max-w-[180px]">{event.title}</div>
                <div className="text-[10.5px] text-gray-500 mt-0.5">
                  {PILLAR_LABELS[event.pillar]}
                  {event.scope === "OUT_OF_CAMPUS" && " \u00b7 Out-of-campus"}
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {formatShortDate(event.startsAt)}
              </td>
              <td className="hidden px-4 py-3 text-gray-600 md:table-cell">
                {event._count?.rsvps ?? "\u2014"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold " +
                    (STATUS_BADGE[event.status] ?? "bg-gray-100 text-gray-500")
                  }
                >
                  <span
                    className={
                      "h-1.5 w-1.5 rounded-full " +
                      (event.status === "CONFIRMED" ? "bg-green-500" :
                       event.status === "DRAFT" ? "bg-amber-400" :
                       event.status === "COMPLETED" ? "bg-gray-400" : "bg-red-400")
                    }
                  />
                  {STATUS_LABELS[event.status]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function EventManagementPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: events, isLoading } = useQuery<UswagEvent[]>({
    queryKey: ["events"],
    queryFn: listEvents,
    staleTime: 2 * 60 * 1000,
  });

  const canCreate = user?.role === "super_admin" || user?.role === "officer_admin";

  const sorted = (events ?? []).sort(
    (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
  );

  function handleCreated() {
    setShowForm(false);
    setSuccessMsg("Event published successfully!");
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  return (
    <div className="min-h-screen bg-mist pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 shadow-sm">
        <div>
          <h1 className="font-heading text-[19px] font-bold text-forest">Events</h1>
          <p className="text-[12px] text-gray-500">Create and manage org activities</p>
        </div>
        {canCreate && (
          <button
            id="btn-new-event"
            onClick={() => setShowForm((v) => !v)}
            className={
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-colors " +
              (showForm
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-primary text-white hover:bg-primary-light")
            }
          >
            {showForm ? (
              "Cancel"
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" className="h-4 w-4 stroke-current">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New Event
              </>
            )}
          </button>
        )}
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-[12.5px] text-green-700 font-semibold">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 stroke-green-600 shrink-0">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {successMsg}
        </div>
      )}

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className={showForm ? "grid gap-6 lg:grid-cols-[360px_1fr]" : ""}>
          {/* Create form */}
          {showForm && canCreate && (
            <div className="rounded-2xl bg-white p-5 shadow-sm self-start">
              <h3 className="mb-4 font-heading text-[15px] font-bold text-forest">Create Event</h3>
              <CreateEventForm onCreated={handleCreated} />
            </div>
          )}

          {/* Events table */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-heading text-[15px] font-bold text-forest">All Events</h3>
              <span className="text-[11px] font-semibold text-gray-500">
                {events?.length ?? 0} total
              </span>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {[0,1,2].map((i) => (
                  <div key={i} className="h-14 rounded-2xl bg-white animate-pulse shadow-sm" />
                ))}
              </div>
            ) : (
              <EventsTable events={sorted} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
