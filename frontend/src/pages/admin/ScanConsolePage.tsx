// Scan Console — verify members' signed QR cards at an event, or an officer's own ID at a
// meeting/forum they conduct (CLAUDE.md "QR membership system"). The camera only decodes; the
// server verifies the signature and logs every attempt. The Auditor has no scan access
// (Article VI) — the page says so and links to the read-only attendance records instead;
// POST /scan refuses too.

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useQRScanner } from '@/hooks/useQRScanner';
import { listEvents } from '@/services/eventService';
import { isSuperAdminEquivalent } from '@/utils/roles';
import type { UswagEvent } from '@/types/event.types';
import type { ScanVerificationResponse } from '@/types/qr.types';
import QRScannerCamera from '@/components/qr/QRScannerCamera';
import ScanResultCard from '@/components/qr/ScanResultCard';
import LockedState from '@/components/common/LockedState';
import PageHeader from '@/components/portal/PageHeader';
import Panel from '@/components/portal/Panel';
import { initials } from '@/components/admin/format';

const LOG_BADGE = {
  valid: 'mp-standing--active',
  invalid: 'mp-standing--rejected',
  expired: 'mp-standing--expired',
} as const;

// Sentinel value for the "Scanning for" select: an officer ID check isn't tied to any
// UswagEvent, so it sits alongside the real events rather than needing a second control.
const OFFICER_MODE = '__officer__';
type ScanMode = 'event' | 'officer';
type LoggedScan = ScanVerificationResponse & { mode: ScanMode };

export default function ScanConsolePage() {
  const { user } = useAuth();

  if (user?.officerPosition === 'auditor') {
    return (
      <div className="mp-page space-y-8">
        <PageHeader eyebrow="Scan" title="Scan console" />
        <LockedState
          title="Scanning isn’t part of the Auditor’s role"
          description="The Auditor reviews attendance but doesn’t take it: Article VI gives the Auditor oversight, not a field role, so the check stays independent. Scanning is done by the Secretary, Treasurer, Business Manager and PRO."
          redirectLabel="View attendance records"
          to="/admin/work?focus=audit-attendance"
        />
      </div>
    );
  }
  return <ScanConsoleContent />;
}

// Separate component so the scanner hook never runs for the Auditor.
function ScanConsoleContent() {
  const { user } = useAuth();
  const [target, setTarget] = useState(''); // '' | OFFICER_MODE | a UswagEvent id
  const [scanning, setScanning] = useState(false);
  const [log, setLog] = useState<LoggedScan[]>([]);

  const mode: ScanMode = target === OFFICER_MODE ? 'officer' : 'event';
  const eventId = mode === 'event' ? target : undefined;

  const { data: events, isLoading } = useQuery<UswagEvent[]>({ queryKey: ['events'], queryFn: listEvents, staleTime: 2 * 60 * 1000 });
  const { result, isVerifying, error, handleDecoded, reset } = useQRScanner(eventId);

  // Every new result goes to the top of this session's log (last 50), tagged with the mode it
  // was scanned in — the response alone can't say (an `invalid` result looks the same either
  // way), so the log and the result card both need this from the caller.
  useEffect(() => {
    if (!result) return;
    setLog((prev) => (prev.some((e) => e.scannedAt === result.scannedAt) ? prev : [{ ...result, mode }, ...prev].slice(0, 50)));
  }, [result, mode]);

  const open = (events ?? [])
    .filter((e) => e.status !== 'COMPLETED' && e.status !== 'CANCELLED')
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
  const selectedEvent = open.find((e) => e.id === target);
  const checkedIn = log.filter((e) => e.mode === 'event' && e.status === 'valid').length;
  const officerChecks = log.filter((e) => e.mode === 'officer' && e.status === 'valid').length;

  return (
    <div className="mp-page space-y-8">
      <PageHeader
        eyebrow={isSuperAdminEquivalent(user) ? 'Operations · Scan' : 'Scan'}
        title="Scan console"
        lead="Choose an event to check members in, or switch to an officer ID check for a meeting or forum you’re conducting. Every scan is checked live and logged."
      />

      <div className="grid lg:grid-cols-[minmax(0,400px)_1fr] gap-6 lg:gap-8 items-start">
        <div className="space-y-4">
          <div>
            <label htmlFor="scan-event" className="ap-label">Scanning for</label>
            {isLoading ? (
              <div className="mp-skeleton h-11" aria-busy="true" />
            ) : (
              <select
                id="scan-event"
                value={target}
                onChange={(e) => {
                  setTarget(e.target.value);
                  setScanning(false);
                  reset();
                }}
                className="ap-input"
              >
                <option value="">Select an event…</option>
                <option value={OFFICER_MODE}>Officer ID check (no event)</option>
                {open.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} · {new Date(ev.startsAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                  </option>
                ))}
              </select>
            )}
            {!isLoading && open.length === 0 && <p className="ap-hint">No open events. Create one under Events, or run an officer ID check instead.</p>}
          </div>

          <div className="mp-vault mp-vault--panel mp-on-dark ap-scanner">
            <div className="ap-scanner__view">
              <QRScannerCamera onDecoded={handleDecoded} active={scanning} />
              {scanning ? (
                <>
                  <span className="ap-scanner__corner ap-scanner__corner--tl" aria-hidden="true" />
                  <span className="ap-scanner__corner ap-scanner__corner--tr" aria-hidden="true" />
                  <span className="ap-scanner__corner ap-scanner__corner--bl" aria-hidden="true" />
                  <span className="ap-scanner__corner ap-scanner__corner--br" aria-hidden="true" />
                  <span className="ap-scanner__line" aria-hidden="true" />
                </>
              ) : (
                <div className="ap-scanner__idle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-sage" aria-hidden="true">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              )}
            </div>
            <div className="relative text-center mt-4" role="status">
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-sage">{scanning ? 'Scanning for' : 'Scanner paused'}</p>
              <p className="font-heading font-semibold text-mist mt-1">
                {mode === 'officer' ? 'Officer ID check' : selectedEvent ? selectedEvent.title : 'No event selected'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={!target}
            onClick={() => {
              if (!scanning) reset();
              setScanning((v) => !v);
            }}
            className={`mp-btn w-full ${scanning ? 'mp-btn--danger' : 'mp-btn--primary'}`}
          >
            {scanning ? 'Stop scanning' : 'Start scanning'}
          </button>
          {!target && <p className="ap-hint text-center">Choose an event, or an officer ID check, to start.</p>}
        </div>

        <div className="space-y-6">
          {isVerifying && (
            <p className="mp-note" role="status">
              <span className="mp-seal w-8 h-8 shrink-0 animate-pulse" aria-hidden="true" />
              Verifying…
            </p>
          )}
          {error && <p role="alert" className="mp-alert">{error}</p>}

          {result && (
            <section aria-labelledby="scan-last">
              <div className="flex items-center gap-4">
                <h2 id="scan-last" className="mp-h2 flex-1">Last scan</h2>
                <button type="button" onClick={reset} className="mp-link text-[0.875rem]">Clear</button>
              </div>
              <div className="mt-3" aria-live="polite">
                <ScanResultCard result={result} mode={mode} />
              </div>
            </section>
          )}

          <Panel
            title="This session"
            aside={
              <span className="mp-standing mp-standing--active">
                {mode === 'officer' ? `${officerChecks} verified` : `${checkedIn} checked in`}
              </span>
            }
            flush
          >
            {log.length === 0 ? (
              <p className="p-8 mp-muted text-center">No scans yet. Each card you scan appears here with its result.</p>
            ) : (
              <ul className="ap-list max-h-[440px] overflow-y-auto uw-scroll">
                {log.map((e, i) => {
                  const who = e.mode === 'officer' ? e.officer?.name : e.member?.name;
                  const sub =
                    e.mode === 'officer'
                      ? e.status === 'valid'
                        ? 'Officer ID'
                        : e.reason ?? 'Verification failed'
                      : e.status === 'valid'
                        ? e.member?.serialNumber
                        : e.reason ?? 'Verification failed';
                  return (
                    <li key={`${e.scannedAt}-${i}`} className="ap-row">
                      <span className="ap-avatar" aria-hidden="true">{initials(who)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{who ?? (e.mode === 'officer' ? 'Not an officer ID' : 'Card not recognised')}</p>
                        <p className="mp-muted text-[0.8125rem] truncate">
                          {new Date(e.scannedAt).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
                          {' · '}
                          {sub}
                        </p>
                      </div>
                      <span className={`mp-standing ${LOG_BADGE[e.status]} shrink-0`}>{e.status}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
