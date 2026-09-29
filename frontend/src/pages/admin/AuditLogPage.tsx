// Audit Log — SUPER ADMIN ONLY: every sensitive action (approvals, finance entries, officer
// changes, bylaws, student-ID views, setup links). RoleRoute allow={['super_admin']} and
// requireRole('SUPER_ADMIN') in audit.routes.ts. The Auditor's oversight lives in their own
// Work module (finance + attendance records), not here.

// Board layout: who's been acting (a bar per person, split by kind of action), then the history
// grouped by day — today and yesterday open, older days collapsed.

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listAuditLog, type AuditLogEntry } from '@/services/adminService';
import PageHeader from '@/components/portal/PageHeader';
import Panel from '@/components/portal/Panel';
import StatPlate from '@/components/portal/StatPlate';
import StackedBar, { type BarSegment, type BarTone } from '@/components/admin/StackedBar';
import BarList from '@/components/admin/BarList';
import BoardGroup from '@/components/admin/BoardGroup';
import { auditLabel, auditTone } from '@/components/admin/audit';
import { apiError, initials } from '@/components/admin/format';

const COLS = '5.5rem minmax(10rem,1.1fr) minmax(11rem,1.1fr) minmax(8rem,0.9fr) minmax(10rem,1.4fr)';

// auditTone → chart colour and legend wording
const TONES: { tone: ReturnType<typeof auditTone>; label: string; bar: BarTone }[] = [
  { tone: 'active', label: 'Approvals', bar: 'success' },
  { tone: 'info', label: 'Records & changes', bar: 'primary' },
  { tone: 'pending', label: 'Pending / links', bar: 'warn' },
  { tone: 'rejected', label: 'Rejections', bar: 'danger' },
  { tone: 'neutral', label: 'Views & checks', bar: 'grey' },
];
const toneSegments = (list: AuditLogEntry[]): BarSegment[] =>
  TONES.map((t) => ({ label: t.label, value: list.filter((e) => auditTone(e.action) === t.tone).length, tone: t.bar }));

function dayLabel(d: Date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
}

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'Members', value: 'member' },
  { label: 'Finance', value: 'finance' },
  { label: 'Officers', value: 'officer' },
  { label: 'Bylaws', value: 'bylaws' },
  { label: 'Events', value: 'event' },
];

function details(e: AuditLogEntry) {
  if (!e.metadata) return '—';
  const parts = Object.entries(e.metadata)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${String(v)}`);
  return parts.length ? parts.join(' · ') : '—';
}

export default function AuditLogPage() {
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useQuery<AuditLogEntry[]>({ queryKey: ['audit-log'], queryFn: listAuditLog, staleTime: 30_000 });

  const entries = data ?? [];
  const q = search.trim().toLowerCase();
  const shown = entries.filter(
    (e) =>
      (!filter || e.action.startsWith(filter)) &&
      (!q || (e.actor?.name ?? '').toLowerCase().includes(q) || auditLabel(e.action).toLowerCase().includes(q) || (e.targetType ?? '').toLowerCase().includes(q))
  );
  const today = new Date().toDateString();

  // Newest first, grouped by calendar day
  const days: { key: string; label: string; list: AuditLogEntry[] }[] = [];
  for (const e of [...shown].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))) {
    const d = new Date(e.createdAt);
    const key = d.toDateString();
    const last = days[days.length - 1];
    if (last?.key === key) last.list.push(e);
    else days.push({ key, label: dayLabel(d), list: [e] });
  }
  // The two most recent days start open; anything the viewer toggles overrides that.
  const [toggled, setToggled] = useState<Set<string>>(new Set());
  const isOpen = (key: string, i: number) => (i < 2) !== toggled.has(key);
  const toggle = (key: string) =>
    setToggled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const actors = new Map<string, { name: string; list: AuditLogEntry[] }>();
  for (const e of entries) {
    const a = actors.get(e.actorId) ?? { name: e.actor?.name ?? `${e.actorId.slice(0, 8)}…`, list: [] };
    a.list.push(e);
    actors.set(e.actorId, a);
  }
  const actorRows = [...actors.entries()]
    .sort((a, b) => b[1].list.length - a[1].list.length)
    .slice(0, 7)
    .map(([id, a]) => ({ key: id, label: a.name, segments: toneSegments(a.list) }));

  return (
    <div className="mp-page !max-w-[1240px] space-y-8">
      <PageHeader
        eyebrow="Oversight · Audit log"
        title="Audit log"
        lead="Who did what, and when. Recorded automatically for every sensitive action."
        actions={<span className="mp-standing mp-standing--neutral">Super Admin only</span>}
      />

      {error && <p role="alert" className="mp-alert">{apiError(error, 'We couldn’t load the audit log.')}</p>}

      <dl className="grid grid-cols-3 gap-3">
        <StatPlate label="Actions" value={isLoading ? '…' : entries.length} tone="neutral" hint="On record" />
        <StatPlate label="Today" value={isLoading ? '…' : entries.filter((e) => new Date(e.createdAt).toDateString() === today).length} tone="primary" />
        <StatPlate label="People" value={isLoading ? '…' : new Set(entries.map((e) => e.actorId)).size} tone="neutral" hint="Distinct actors" />
      </dl>

      {!isLoading && entries.length > 0 && (
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-6 items-start">
          <Panel title="Actions by person">
            <BarList label="Audit-logged actions by person, split by kind" rows={actorRows} />
          </Panel>
          <Panel title="Kinds of action">
            <StackedBar label="Audit-logged actions by kind" segments={toneSegments(entries)} legend size="lg" />
            <p className="mp-muted text-[0.8125rem] mt-5 leading-relaxed">
              Student-ID views and officer ID checks are logged too — a spike in either is worth a second look.
            </p>
          </Panel>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div role="group" aria-label="Filter by area" className="flex gap-2 overflow-x-auto uw-scroll-hidden -mx-1 px-1 pb-1">
          {FILTERS.map((f) => (
            <button key={f.value} type="button" className="mp-chip" aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="ap-search w-full lg:max-w-xs lg:ml-auto">
          <label htmlFor="audit-search" className="mp-sr-only">Search the audit log</label>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input id="audit-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Person or action" className="ap-input" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} className="mp-skeleton h-14" />)}</div>
      ) : shown.length === 0 ? (
        <p className="mp-card p-10 mp-muted text-center">No entries match. Actions on members, finances, officers and bylaws are logged automatically.</p>
      ) : (
        <div className="ap-board" style={{ ['--ap-cols' as string]: COLS }}>
          {days.map((day, i) => (
            <BoardGroup
              key={day.key}
              id={`audit-day-${i}`}
              title={day.label}
              count={`${day.list.length} ${day.list.length === 1 ? 'entry' : 'entries'}`}
              accent={i === 0 ? 0 : i === 1 ? 3 : 5}
              summary={<StackedBar label={`${day.label}, actions by kind`} segments={toneSegments(day.list)} />}
              open={isOpen(day.key, i)}
              onToggle={() => toggle(day.key)}
              columns={
                <>
                  <span>Time</span>
                  <span>Who</span>
                  <span>Action</span>
                  <span>Target</span>
                  <span>Details</span>
                </>
              }
            >
              {day.list.map((e) => {
                const actor = e.actor?.name ?? `${e.actorId.slice(0, 8)}…`;
                return (
                  <div key={e.id} className="ap-board-row">
                    <div className="mp-num text-[0.875rem] whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                    <div data-label="Who" className="flex items-center gap-2.5">
                      <span className="ap-avatar !w-8 !h-8 !text-[0.6875rem]" aria-hidden="true">{initials(actor)}</span>
                      <span className="font-semibold truncate">{actor}</span>
                    </div>
                    <div data-label="Action"><span className={`mp-standing mp-standing--${auditTone(e.action)}`}>{auditLabel(e.action)}</span></div>
                    <div data-label="Target" className="text-[0.875rem]">
                      {e.targetType ?? '—'}
                      {e.targetId && <span className="mp-muted font-mono text-[0.75rem] ml-1.5">{e.targetId.slice(0, 8)}…</span>}
                    </div>
                    <div data-label="Details" className="mp-muted text-[0.8125rem] truncate" title={details(e)}>{details(e)}</div>
                  </div>
                );
              })}
            </BoardGroup>
          ))}
        </div>
      )}
    </div>
  );
}
