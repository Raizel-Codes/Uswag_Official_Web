import { useEffect, useState } from 'react';
import Logo from '@/components/common/Logo';
import { IS_BETA } from '@/config/release';
import type { MaintenanceInfo } from '@/config/maintenance';
import '@/styles/maintenance.css';

const FACEBOOK_URL = 'https://www.facebook.com/share/1FkuYoYfnN/';
const TIME_ZONE = 'Asia/Manila';

const timeFmt = new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit', timeZone: TIME_ZONE });
const dayFmt = new Intl.DateTimeFormat('en-PH', { weekday: 'short', timeZone: TIME_ZONE });
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE });

/** "3:45 PM", or "Tue 3:45 PM" when it isn't today (Philippine time, whatever the visitor's own zone). */
export function formatExpectedBack(date: Date, now: Date = new Date()): string {
  const time = timeFmt.format(date);
  return dayKey.format(date) === dayKey.format(now) ? time : `${dayFmt.format(date)} ${time}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** [hours?, minutes, seconds] for the clock. */
function clockParts(ms: number): string[] {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? [String(h), pad(m), pad(s % 60)] : [pad(m), pad(s % 60)];
}

/** The server's clock, ticking once a second (the visitor's own clock can be wrong). */
function useServerNow(offsetMs: number) {
  const [now, setNow] = useState(() => Date.now() + offsetMs);
  useEffect(() => {
    setNow(Date.now() + offsetMs);
    const timer = setInterval(() => setNow(Date.now() + offsetMs), 1000);
    return () => clearInterval(timer);
  }, [offsetMs]);
  return now;
}

const REASSURANCE = [
  { title: 'Your membership and QR card are safe', desc: 'An update doesn’t change anything about your account.' },
  { title: 'Nothing you submitted is lost', desc: 'Applications and sign-ups we already have stay on record.' },
  { title: 'No need to refresh', desc: 'This page reopens the site by itself the moment we’re done.' },
];

/**
 * Shown to everyone but the developer while the site is in maintenance (MaintenanceGate). Same look as the
 * login page: Lora headline on Mist, and a Deep Forest plate carrying the countdown. The clock follows the
 * server's time, and when the estimate passes it says so plainly instead of showing zero: the site only
 * reopens when the developer turns maintenance off.
 */
export default function MaintenancePage({ info, offsetMs }: { info: MaintenanceInfo | null; offsetMs: number }) {
  const now = useServerNow(offsetMs);
  const end = info?.endsAt ? Date.parse(info.endsAt) : null;
  const start = info?.startedAt ? Date.parse(info.startedAt) : null;
  const remaining = end === null ? null : end - now;
  const late = remaining !== null && remaining <= 0;
  const progress = start !== null && end !== null && end > start ? Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100)) : 0;
  const parts = remaining !== null && !late ? clockParts(remaining) : null;
  const minutesLeft = remaining !== null && !late ? Math.ceil(remaining / 60000) : null;

  // Not for search engines, and a tab title that says what this is.
  useEffect(() => {
    const previous = document.title;
    document.title = 'USWAG — Back shortly';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => {
      document.title = previous;
      meta.remove();
    };
  }, []);

  return (
    <div className="mt">
      <main className="mt-wrap" aria-labelledby="mt-heading">
        <div>
          <div className="mt-brand">
            <span className="mt-crest">
              <Logo size={42} showWordmark={false} />
            </span>
            <p className="mt-eyebrow">The USWAG Record · Scheduled maintenance</p>
          </div>
          <h1 id="mt-heading" className="mt-h1">
            We’re tending the records.
          </h1>
          <p className="mt-lead">
            USWAG is being updated so it stays safe and reliable. Your account and your data aren’t affected, and we’ll be back shortly.
          </p>
          {info?.message && <p className="mt-note">“{info.message}”</p>}
          <p className="mt-foot">
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">
              Questions? Message us on Facebook
            </a>
            {IS_BETA && <span>Beta version, testing phase</span>}
          </p>
        </div>

        <aside className="mt-vault" aria-label="Time remaining">
          {parts ? (
            <>
              <p className="mt-label">Estimated time remaining</p>
              <div className="mt-clock" aria-hidden="true">
                {parts.map((p, i) => (
                  <span key={i} style={{ display: 'contents' }}>
                    {i > 0 && <span className="mt-sep">:</span>}
                    <span>{p}</span>
                  </span>
                ))}
              </div>
              <div className="mt-units" aria-hidden="true">
                {parts.length === 3 && <span style={{ marginRight: '1.5rem' }}>hours</span>}
                <span>minutes</span>
                <span style={{ marginLeft: parts.length === 3 ? '1.75rem' : '2.5rem' }}>seconds</span>
              </div>
              <div className="mt-bar" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-expect">
                Expected back about <strong>{formatExpectedBack(new Date(end!), new Date(now))}</strong> Philippine time.
              </p>
              <p className="mt-sr" role="status">
                About {minutesLeft} minute{minutesLeft === 1 ? '' : 's'} remaining.
              </p>
            </>
          ) : late ? (
            <>
              <p className="mt-label">Taking a little longer</p>
              <p className="mt-late">
                Still working on it. <em>Thank you for waiting.</em>
              </p>
              <div className="mt-bar mt-bar--busy" aria-hidden="true">
                <span />
              </div>
              <p className="mt-expect">The estimate has passed. This page reopens the site automatically once the update is finished.</p>
              <p className="mt-sr" role="status">
                The update is taking longer than expected.
              </p>
            </>
          ) : (
            <>
              <p className="mt-label">Back shortly</p>
              <p className="mt-late">
                We’ll reopen <em>as soon as we can.</em>
              </p>
              <div className="mt-bar mt-bar--busy" aria-hidden="true">
                <span />
              </div>
            </>
          )}

          <ul className="mt-list">
            {REASSURANCE.map((r) => (
              <li key={r.title}>
                <span>
                  <strong>{r.title}.</strong> {r.desc}
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}
