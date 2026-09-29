// Events — create and review the org's activities (/admin/events; the Super Admin's
// Operations section). POST /events is limited to SUPER_ADMIN / OFFICER_ADMIN on the server.
// `?new=1` opens the create form (the dashboard's "+ New event").
// Board layout: events by advocacy as a chart, then Upcoming / Past / Cancelled groups, each
// with a status summary and a sign-ups meter per event.

import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { usePortalToast } from '@/hooks/usePortalToast';
import { listEvents, createEvent, type CreateEventPayload } from '@/services/eventService';
import { PILLAR_LABELS, STATUS_LABELS, type EventStatus, type UswagEvent } from '@/types/event.types';
import PageHeader from '@/components/portal/PageHeader';
import Panel from '@/components/portal/Panel';
import PortalToast from '@/components/portal/PortalToast';
import StackedBar, { type BarSegment, type BarTone } from '@/components/admin/StackedBar';
import BarList from '@/components/admin/BarList';
import BoardGroup from '@/components/admin/BoardGroup';
import Meter from '@/components/admin/Meter';
import { EVENT_BADGE, signupMeter } from '@/components/admin/events';
import { apiError, formatDate } from '@/components/admin/format';

const COLS = 'minmax(15rem,2.4fr) minmax(7rem,0.9fr) minmax(10rem,1.2fr) 8rem';
const STATUS_ORDER: EventStatus[] = ['CONFIRMED', 'DRAFT', 'COMPLETED', 'CANCELLED'];
const STATUS_TONE: Record<EventStatus, BarTone> = { CONFIRMED: 'success', DRAFT: 'warn', COMPLETED: 'grey', CANCELLED: 'danger' };
const statusSegments = (list: UswagEvent[]): BarSegment[] =>
  STATUS_ORDER.map((s) => ({ label: STATUS_LABELS[s], value: list.filter((e) => e.status === s).length, tone: STATUS_TONE[s] }));

const EMPTY: CreateEventPayload = { title: '', description: '', pillar: 'YOUTH_VOICE', scope: 'IN_CAMPUS', location: '', startsAt: '', limitedSlots: null };

function CreateEventForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState<CreateEventPayload>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setForm(EMPTY);
      onCreated();
    },
    onError: (err) => setError(apiError(err, 'Could not create the event. Please try again.')),
  });
  const set = (patch: Partial<CreateEventPayload>) => setForm((f) => ({ ...f, ...patch }));
  const outOfCampus = form.scope === 'OUT_OF_CAMPUS';

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) return setError('Give the event a title.');
    if (!form.startsAt) return setError('Choose the date and time.');
    if (!form.location.trim()) return setError('Add a location.');
    if (!form.description.trim()) return setError('Add a short description.');
    if (outOfCampus && !form.limitedSlots) return setError('Out-of-campus events need a number of slots.');
    mutation.mutate({
      ...form,
      title: form.title.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
      startsAt: new Date(form.startsAt).toISOString(),
      limitedSlots: outOfCampus ? Number(form.limitedSlots) : null,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="ev-title" className="ap-label">Title</label>
        <input id="ev-title" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Coastal Cleanup Drive" className="ap-input" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ev-pillar" className="ap-label">Advocacy</label>
          <select id="ev-pillar" value={form.pillar} onChange={(e) => set({ pillar: e.target.value as CreateEventPayload['pillar'] })} className="ap-input">
            <option value="YOUTH_VOICE">Youth Voice &amp; Participation</option>
            <option value="MENTAL_HEALTH">Mental Health &amp; Wellness</option>
            <option value="ENVIRONMENTAL">Environmental Leadership</option>
          </select>
        </div>
        <div>
          <label htmlFor="ev-scope" className="ap-label">Type</label>
          <select id="ev-scope" value={form.scope} onChange={(e) => set({ scope: e.target.value as CreateEventPayload['scope'], limitedSlots: null })} className="ap-input">
            <option value="IN_CAMPUS">In campus (RSVP)</option>
            <option value="OUT_OF_CAMPUS">Out of campus (limited slots)</option>
          </select>
        </div>
      </div>
      <div className={`grid gap-4 ${outOfCampus ? 'sm:grid-cols-2' : ''}`}>
        <div>
          <label htmlFor="ev-date" className="ap-label">Date &amp; time</label>
          <input id="ev-date" type="datetime-local" value={form.startsAt} onChange={(e) => set({ startsAt: e.target.value })} className="ap-input" />
        </div>
        {outOfCampus && (
          <div>
            <label htmlFor="ev-slots" className="ap-label">Slots</label>
            <input id="ev-slots" type="number" inputMode="numeric" min={1} value={form.limitedSlots ?? ''} onChange={(e) => set({ limitedSlots: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 30" className="ap-input" />
          </div>
        )}
      </div>
      <div>
        <label htmlFor="ev-location" className="ap-label">Location</label>
        <input id="ev-location" value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder="e.g. Gymnasium, NwSSU Main Campus" className="ap-input" />
      </div>
      <div>
        <label htmlFor="ev-desc" className="ap-label">Description</label>
        <textarea id="ev-desc" rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="What is this event about?" className="ap-input" />
      </div>
      {error && <p role="alert" className="mp-alert">{error}</p>}
      <button type="submit" disabled={mutation.isPending} className="mp-btn mp-btn--primary w-full sm:w-auto">
        {mutation.isPending ? 'Publishing…' : 'Publish event'}
      </button>
    </form>
  );
}

export default function EventManagementPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const showForm = params.get('new') === '1';
  const { toast, show } = usePortalToast();
  const { data: events, isLoading } = useQuery<UswagEvent[]>({ queryKey: ['events'], queryFn: listEvents, staleTime: 2 * 60 * 1000 });
  const canCreate = user?.role === 'super_admin' || user?.role === 'officer_admin';
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(['cancelled']));

  const all = events ?? [];
  const now = Date.now();
  const byDate = (dir: 1 | -1) => (a: UswagEvent, b: UswagEvent) => dir * (+new Date(a.startsAt) - +new Date(b.startsAt));
  const groups = [
    { key: 'upcoming', title: 'Upcoming', accent: 0, list: all.filter((e) => e.status !== 'CANCELLED' && +new Date(e.startsAt) >= now).sort(byDate(1)) },
    { key: 'past', title: 'Past', accent: 5, list: all.filter((e) => e.status !== 'CANCELLED' && +new Date(e.startsAt) < now).sort(byDate(-1)) },
    { key: 'cancelled', title: 'Cancelled', accent: 2, list: all.filter((e) => e.status === 'CANCELLED').sort(byDate(-1)) },
  ].filter((g) => g.list.length > 0);
  const busiest = Math.max(0, ...all.map((e) => e._count?.rsvps ?? 0));
  const pillars = (Object.keys(PILLAR_LABELS) as UswagEvent['pillar'][]).map((p) => ({
    key: p,
    label: PILLAR_LABELS[p],
    segments: statusSegments(all.filter((e) => e.pillar === p)),
  }));

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const toggleForm = (open: boolean) => setParams(open ? { new: '1' } : {}, { replace: true });

  return (
    <div className="mp-page !max-w-[1240px] space-y-8">
      <PageHeader
        eyebrow="Operations · Events"
        title="Events"
        lead="Create the org’s activities and see sign-ups at a glance."
        actions={canCreate && (
          <button type="button" onClick={() => toggleForm(!showForm)} className={`mp-btn ${showForm ? 'mp-btn--ghost' : 'mp-btn--primary'}`} aria-expanded={showForm} aria-controls="new-event">
            {showForm ? 'Close form' : '+ New event'}
          </button>
        )}
      />

      {showForm && canCreate && (
        <Panel title="New event" id="new-event" className="max-w-2xl">
          <CreateEventForm
            onCreated={() => {
              toggleForm(false);
              show('Event published');
            }}
          />
        </Panel>
      )}

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-14" />)}</div>
      ) : all.length === 0 ? (
        <p className="mp-card p-10 mp-muted text-center">No events yet.{canCreate ? ' Create the first one with “New event”.' : ''}</p>
      ) : (
        <>
          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
            <Panel title="Events by advocacy">
              <BarList label="Events by advocacy, split by status" rows={pillars} />
            </Panel>
            <Panel title="Status">
              <p className="mp-stat">{all.length}</p>
              <p className="mp-muted text-[0.8125rem] mt-1">events on record</p>
              <StackedBar className="mt-5" label="Events by status" segments={statusSegments(all)} legend size="lg" />
            </Panel>
          </div>

          <div className="ap-board" style={{ ['--ap-cols' as string]: COLS }}>
            {groups.map((g) => (
              <BoardGroup
                key={g.key}
                id={`events-${g.key}`}
                title={g.title}
                count={`${g.list.length} event${g.list.length === 1 ? '' : 's'}`}
                accent={g.accent}
                summary={<StackedBar label={`${g.title} events by status`} segments={statusSegments(g.list)} />}
                open={!collapsed.has(g.key)}
                onToggle={() => toggle(g.key)}
                columns={
                  <>
                    <span>Event</span>
                    <span>Date</span>
                    <span>Sign-ups</span>
                    <span>Status</span>
                  </>
                }
              >
                {g.list.map((e) => {
                  const meter = signupMeter(e, busiest);
                  return (
                    <div key={e.id} className="ap-board-row">
                      <div>
                        <p className="font-semibold">{e.title}</p>
                        <p className="mp-muted text-[0.8125rem]">
                          {PILLAR_LABELS[e.pillar]} · {e.scope === 'OUT_OF_CAMPUS' ? 'Out of campus' : 'In campus'} · {e.location}
                        </p>
                      </div>
                      <div data-label="Date" className="mp-muted whitespace-nowrap text-[0.875rem]">{formatDate(e.startsAt)}</div>
                      <div data-label="Sign-ups"><Meter percent={meter.percent} text={meter.text} label="Sign-ups" tone={meter.tone} /></div>
                      <div data-label="Status"><span className={`mp-standing ${EVENT_BADGE[e.status]}`}>{STATUS_LABELS[e.status]}</span></div>
                    </div>
                  );
                })}
              </BoardGroup>
            ))}
          </div>
        </>
      )}

      <PortalToast toast={toast} />
    </div>
  );
}
