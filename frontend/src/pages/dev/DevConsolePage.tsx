// The developer's /dev console: a terminal-style window onto the live server. It looks like a shell and
// is not one: each command calls a fixed, read-only endpoint (backend dev.service.ts), so nothing typed
// here can run code, touch the database or change anything. Settings are reported as set / not set,
// never as values. The account behind it is view-only on the whole site (auth.middleware.ts).
//
// Colours are the brand tokens: deep for the screen, mist for text, sage for accents; the pale warn
// and danger tints for problems (the saturated ones don't reach contrast on deep).

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { apiError } from '@/utils/apiError';

type Kind = 'cmd' | 'out' | 'err' | 'dim';
interface Line {
  id: number;
  kind: Kind;
  text: string;
}

const REMOTE = ['status', 'users', 'audit', 'jobs', 'config', 'errors'] as const;
type Remote = (typeof REMOTE)[number];

const HELP = [
  'status          API uptime, version, database latency',
  'users           accounts, memberships, events, push devices',
  'audit [n]       the last n audit-log entries (default 20)',
  'jobs            Facebook sync and membership-renewal jobs',
  'config          which settings are on (never their values)',
  'errors [n]      recent server errors (cleared when the server restarts)',
  'whoami          who you are signed in as',
  'admin           open the admin console (view only)',
  'clear           clear the screen',
  'logout          sign out',
  'help            this list',
  '',
  '↑ / ↓ recalls earlier commands. Everything here is read-only.',
].join('\n');

const pad = (s: string, n: number) => (s.length >= n ? s + ' ' : s + ' '.repeat(n - s.length));
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'medium', hour12: false }) : 'never');
const span = (sec: number) => {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m ${sec % 60}s`;
};
const tally = (o: Record<string, number>) => (Object.keys(o).length ? Object.entries(o).map(([k, v]) => `${k.toLowerCase()} ${v}`).join(' · ') : 'none');

/* eslint-disable @typescript-eslint/no-explicit-any */
const FORMAT: Record<Remote, (d: any) => { text: string; bad?: boolean }> = {
  status: (d) => ({
    bad: !d.db.ok,
    text: [
      `${pad('api', 10)}ok · up ${span(d.uptimeSeconds)} · node ${d.node} · ${d.environment}${d.commit ? ` · commit ${d.commit}` : ''}`,
      `${pad('database', 10)}${d.db.ok ? `ok · ${d.db.latencyMs} ms` : `DOWN · ${d.db.error}`}`,
      `${pad('memory', 10)}${d.memoryMb} MB`,
      `${pad('time', 10)}${when(d.time)}`,
    ].join('\n'),
  }),
  users: (d) => ({
    text: [
      `${pad('accounts', 12)}${tally(d.accountsByRole)}`,
      `${pad('members', 12)}${tally(d.membersByStanding)}`,
      `${pad('events', 12)}${tally(d.eventsByStatus)}`,
      `${pad('setup link', 12)}${d.awaitingPasswordSetup} waiting to set a password`,
      `${pad('push', 12)}${d.pushDevices} device(s)`,
      `${pad('audit log', 12)}${d.auditEntries} entries`,
      `${pad('resets', 12)}${d.openResetRequests} open request(s)`,
    ].join('\n'),
  }),
  audit: (rows: any[]) => ({ text: rows.length ? rows.map((r) => `${when(r.at)}  ${pad(r.actor, 20)} ${r.action}`).join('\n') : 'The audit log is empty.' }),
  jobs: (d) => {
    const f = d.facebookSync;
    const r = d.membershipRenewal;
    return {
      bad: Boolean(f.lastSyncError || r.lastError),
      text: [
        `facebook-sync       ${f.configured ? `on · ${f.schedule}` : 'OFF · not configured'}`,
        `  last sync         ${when(f.lastSyncedAt)}${f.lastSyncCount !== null ? ` · ${f.lastSyncCount} posts` : ''}${f.lastSyncError ? `\n  error             ${f.lastSyncError}` : ''}`,
        `membership-renewal  ${r.schedule}`,
        `  last run          ${when(r.lastRunAt)}${r.lastExpired !== null ? ` · expired ${r.lastExpired}` : ''}${r.lastError ? `\n  error             ${r.lastError}` : ''}`,
      ].join('\n'),
    };
  },
  config: (d) => ({
    text: [
      `${pad('environment', 14)}${d.environment}`,
      `${pad('frontend', 14)}${d.frontendOrigin}`,
      `${pad('facebook sync', 14)}${d.facebookSync ? 'configured' : 'not configured'}`,
      `${pad('email', 14)}${d.email ? 'configured' : 'not configured (reset links can’t be emailed)'}`,
      `${pad('web push', 14)}${d.webPush ? 'configured' : 'not configured'}`,
    ].join('\n'),
  }),
  errors: (rows: any[]) => ({ bad: rows.length > 0, text: rows.length ? rows.map((r) => `${when(r.at)}  ${r.message}`).join('\n') : 'No errors since the server started.' }),
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const TONE: Record<Kind, string> = {
  cmd: 'text-sage',
  out: 'text-mist',
  err: 'text-dangerBg',
  dim: 'text-mist/60',
};

interface Pulse {
  ok: boolean;
  text: string;
}

export default function DevConsolePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const print = useCallback((kind: Kind, text: string) => {
    setLines((prev) => [...prev, { id: nextId.current++, kind, text }]);
  }, []);

  const runRemote = useCallback(
    async (name: Remote, n?: number) => {
      try {
        const { data } = await api.get<{ data: unknown }>(`/dev/${name}`, { params: n ? { n } : undefined });
        const out = FORMAT[name](data.data);
        print(out.bad ? 'err' : 'out', out.text);
      } catch (err) {
        print('err', apiError(err, `${name}: the server didn’t answer.`));
      }
    },
    [print],
  );

  async function execute(raw: string) {
    const [cmd = '', arg] = raw.trim().split(/\s+/);
    if (!cmd) return;
    print('cmd', raw.trim());
    const n = arg && /^\d+$/.test(arg) ? Number(arg) : undefined;
    if ((REMOTE as readonly string[]).includes(cmd)) {
      setBusy(true);
      await runRemote(cmd as Remote, n);
      setBusy(false);
    } else if (cmd === 'help') print('out', HELP);
    else if (cmd === 'clear') setLines([]);
    else if (cmd === 'whoami') print('out', `${user?.name}\n${user?.email}\nSuper Admin access, developer account: view only`);
    else if (cmd === 'admin') navigate('/admin');
    else if (cmd === 'logout' || cmd === 'exit') {
      await logout();
      navigate('/login', { replace: true });
    } else print('err', `${cmd}: command not found. Type help.`);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const raw = value;
    setValue('');
    if (raw.trim()) {
      history.current.push(raw.trim());
      cursor.current = history.current.length;
    }
    // One at a time, in the order typed, so quick or pasted commands can't interleave their output.
    queue.current = queue.current.then(() => execute(raw));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const h = history.current;
    if (h.length === 0) return;
    cursor.current = e.key === 'ArrowUp' ? Math.max(0, cursor.current - 1) : Math.min(h.length, cursor.current + 1);
    setValue(h[cursor.current] ?? '');
  }

  // First screen: a greeting and the server's status.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return; // React's dev-mode double effect would greet twice
    booted.current = true;
    print('dim', 'USWAG developer console · read-only · type help for commands');
    void execute('status');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The strip at the top: the same status check every 10 seconds, so a dead API or database shows without typing.
  useEffect(() => {
    let live = true;
    const beat = async () => {
      try {
        const { data } = await api.get<{ data: { db: { ok: boolean; latencyMs?: number }; uptimeSeconds: number } }>('/dev/status');
        const d = data.data;
        if (live) setPulse({ ok: d.db.ok, text: d.db.ok ? `api ok · db ${d.db.latencyMs} ms · up ${span(d.uptimeSeconds)}` : 'database down' });
      } catch {
        if (live) setPulse({ ok: false, text: 'api unreachable' });
      }
    };
    void beat();
    const timer = setInterval(beat, 10_000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [lines]);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-forest text-mist font-mono text-[0.8125rem] sm:text-[0.875rem] leading-relaxed" onClick={() => inputRef.current?.focus()}>
      <header className="sticky top-0 z-10 bg-forest border-b border-sage/25 px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="text-sage font-semibold">uswag-dev</span>
        <span className={`flex items-center gap-2 ${pulse && !pulse.ok ? 'text-dangerBg' : 'text-mist/80'}`} role="status">
          <span aria-hidden="true" className={`inline-block w-2 h-2 rounded-full ${!pulse ? 'bg-mist/40' : pulse.ok ? 'bg-sage' : 'bg-dangerBg'}`} />
          {pulse ? pulse.text : 'checking…'}
        </span>
        <span className="ml-auto flex gap-4">
          <Link to="/admin" className="text-sage underline underline-offset-2">admin</Link>
        </span>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-4 space-y-2 overflow-x-hidden" role="log" aria-live="polite" aria-label="Console output">
        {lines.map((l) => (
          <div key={l.id} className={`whitespace-pre-wrap break-words ${TONE[l.kind]}`}>
            {l.kind === 'cmd' ? <span className="text-mist/60">$ </span> : null}
            {l.text}
          </div>
        ))}
        {busy && <div className="text-mist/60">…</div>}
        <div ref={endRef} />
      </main>

      <form onSubmit={onSubmit} className="sticky bottom-0 bg-forest border-t border-sage/25 px-4 sm:px-6 py-3 flex items-center gap-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <label htmlFor="dev-input" className="text-sage shrink-0">$</label>
        <input
          id="dev-input"
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          placeholder="type a command, or help"
          className="flex-1 min-w-0 bg-transparent text-mist placeholder:text-mist/40 outline-none caret-sage text-[16px] sm:text-[inherit]"
        />
      </form>
    </div>
  );
}
