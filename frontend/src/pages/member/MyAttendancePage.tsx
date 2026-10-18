// Member portal — Attendance. Its own tab (no longer inside the card page): every scan of the
// member's card, as a ledger, with the summary above it. Available to every member — a
// pending member simply has no scans yet, and the page says why.
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyAttendance } from '@/services/attendanceService';
import { useMyProfile } from '@/hooks/useMyProfile';
import { PILLAR_LABELS, type AttendanceHistoryEntry, type MemberAttendanceHistory } from '@/types/event.types';
import PageHeader from '@/components/portal/PageHeader';
import { isActive } from '@/components/member/standing';

const RESULT: Record<AttendanceHistoryEntry['result'], { cls: string; label: string }> = {
  VALID: { cls: 'mp-standing--active', label: 'Present' },
  EXPIRED: { cls: 'mp-standing--expired', label: 'Expired card' },
  INVALID: { cls: 'mp-standing--rejected', label: 'Not accepted' },
  DUPLICATE: { cls: 'mp-standing--pending', label: 'Repeat scan' }, // not returned to members; keeps the map total
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }),
  };
}

export default function MyAttendancePage() {
  const { data: profile } = useMyProfile();
  const { data, isLoading, isError, refetch } = useQuery<MemberAttendanceHistory>({
    queryKey: ['member', 'attendance'],
    queryFn: getMyAttendance,
    staleTime: 60 * 1000,
  });

  const summary = data
    ? [
        { label: 'Present', value: String(data.validScans) },
        { label: 'Attendance rate', value: `${data.attendanceRate}%` },
        { label: 'Total scans', value: String(data.totalScans) },
      ]
    : null;

  return (
    <div className="mp-page space-y-10">
      <PageHeader
        eyebrow="Attendance"
        title="Your attendance"
        lead="Every time an officer scans your card at an event, it’s recorded here — accepted or not."
      />

      <section aria-label="Summary" className="mp-vault mp-vault--panel mp-on-dark p-6 sm:p-8">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-16" />)}
          </div>
        ) : summary ? (
          <dl className="relative grid grid-cols-3 gap-4 divide-x divide-[rgb(152_203_176/0.25)]">
            {summary.map((s, i) => (
              <div key={s.label} className={i ? 'pl-4' : ''}>
                <dt className="text-[0.6875rem] sm:text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-sage">{s.label}</dt>
                <dd className="mp-stat text-mist mt-2">{s.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="relative">Your summary will appear here once your history loads.</p>
        )}
      </section>

      <section aria-labelledby="att-history">
        <h2 id="att-history" className="mp-h2">History</h2>

        {isError && (
          <div className="mt-4 space-y-3">
            <p role="alert" className="mp-alert">We couldn’t load your attendance history.</p>
            <button type="button" onClick={() => refetch()} className="mp-btn mp-btn--ghost">Try again</button>
          </div>
        )}

        {isLoading ? (
          <div className="mt-4 space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="mp-skeleton h-16" />)}
          </div>
        ) : data && data.records.length > 0 ? (
          <ol className="mp-card mp-ledger mt-4 px-5 sm:px-6">
            {data.records.map((entry) => {
              const when = formatWhen(entry.scannedAt);
              const r = RESULT[entry.result];
              return (
                <li key={entry.id} className="py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                  <div className="sm:w-32 shrink-0">
                    <p className="mp-num text-[0.9375rem] font-semibold">{when.date}</p>
                    <p className="mp-muted text-[0.8125rem]">{when.time}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{entry.event?.title ?? 'Event no longer listed'}</p>
                    <p className="mp-muted text-[0.875rem]">
                      {entry.event ? PILLAR_LABELS[entry.event.pillar] : 'USWAG event'}
                      {entry.result !== 'VALID' && entry.reason ? ` · ${entry.reason}` : ''}
                    </p>
                  </div>
                  <span className={`mp-standing ${r.cls} self-start sm:self-center`}>{r.label}</span>
                </li>
              );
            })}
          </ol>
        ) : !isError ? (
          <div className="mp-card p-8 mt-4 text-center">
            <p className="mp-h3">No scans yet</p>
            <p className="mp-muted mt-2 text-[0.9375rem] max-w-[46ch] mx-auto">
              {isActive(profile?.status) ? (
                <>
                  Show your card at the next event and it will be recorded here.{' '}
                  <Link to="/dashboard/events" className="mp-link">See upcoming events</Link>
                </>
              ) : (
                <>Attendance starts once your membership is active and your card is issued.</>
              )}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
