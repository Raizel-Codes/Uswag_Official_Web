import { useCallback, useEffect, useRef, useState } from 'react';
import { getSiteStatus } from '@/services/siteStatusService';
import { MAINTENANCE_EVENT, MAINTENANCE_MEMORY_KEY, MAINTENANCE_MEMORY_MS, type MaintenanceInfo } from '@/config/maintenance';

export interface SiteState {
  /** 'unknown' until the first answer; the app is NOT held back while it is (an unreachable API alone never blocks it). */
  phase: 'unknown' | 'open' | 'maintenance';
  info: MaintenanceInfo | null;
  /** serverTime - local time, so the countdown follows the server's clock. */
  offsetMs: number;
}

const OPEN_POLL_MS = 60_000;
const MAINTENANCE_POLL_MS = 20_000;

function readMemory(): MaintenanceInfo | null {
  try {
    const raw = localStorage.getItem(MAINTENANCE_MEMORY_KEY);
    if (!raw) return null;
    const { info, seenAt } = JSON.parse(raw) as { info: MaintenanceInfo; seenAt: number };
    return Date.now() - seenAt < MAINTENANCE_MEMORY_MS ? info : null;
  } catch {
    return null;
  }
}
const remember = (info: MaintenanceInfo) => {
  try {
    localStorage.setItem(MAINTENANCE_MEMORY_KEY, JSON.stringify({ info, seenAt: Date.now() }));
  } catch {
    /* private mode: the page still works, it just can't survive an unreachable API */
  }
};
const forget = () => {
  try {
    localStorage.removeItem(MAINTENANCE_MEMORY_KEY);
  } catch {
    /* nothing to forget */
  }
};

/**
 * Is the site in maintenance? Asked once on load, then every minute (every 20 s while in maintenance, so
 * reopening is noticed quickly), whenever the tab comes back or the device comes online, and instantly
 * when the API client reports a 503 MAINTENANCE (MAINTENANCE_EVENT).
 *
 * If the server can't be reached it keeps the last answer. Mid-deploy the API is usually down, and a page
 * that vanished the moment the server did would defeat the point; so a recently seen maintenance notice
 * stays up (not while the device is offline: a member showing a cached card without signal isn't blocked).
 */
export function useSiteStatus(): SiteState {
  const [state, setState] = useState<SiteState>(() => {
    const remembered = typeof navigator !== 'undefined' && navigator.onLine === false ? null : readMemory();
    return remembered ? { phase: 'maintenance', info: remembered, offsetMs: 0 } : { phase: 'unknown', info: null, offsetMs: 0 };
  });
  const phaseRef = useRef(state.phase);
  phaseRef.current = state.phase;

  const check = useCallback(async () => {
    try {
      const status = await getSiteStatus();
      const offsetMs = Date.parse(status.serverTime) - Date.now();
      if (status.maintenance.enabled) {
        const info = { startedAt: status.maintenance.startedAt, endsAt: status.maintenance.endsAt, message: status.maintenance.message };
        remember(info);
        setState({ phase: 'maintenance', info, offsetMs });
      } else {
        forget();
        setState({ phase: 'open', info: null, offsetMs });
      }
    } catch (err) {
      // A 503 MAINTENANCE can't come from /status (it is exempt). Anything else is "can't reach the server":
      // keep whatever was known, and let a first-time failure leave the app open.
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 503 && phaseRef.current !== 'maintenance') setState((s) => ({ ...s, phase: 'maintenance', info: s.info ?? { startedAt: null, endsAt: null, message: null } }));
      else if (phaseRef.current === 'unknown') setState((s) => ({ ...s, phase: 'open' }));
    }
  }, []);

  useEffect(() => {
    void check();
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<MaintenanceInfo>).detail;
      const info = { startedAt: detail?.startedAt ?? null, endsAt: detail?.endsAt ?? null, message: detail?.message ?? null };
      remember(info);
      setState({ phase: 'maintenance', info, offsetMs: detail?.serverTime ? Date.parse(detail.serverTime) - Date.now() : 0 });
    };
    const onVisible = () => document.visibilityState === 'visible' && void check();
    const onOnline = () => void check();
    window.addEventListener(MAINTENANCE_EVENT, onEvent);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener(MAINTENANCE_EVENT, onEvent);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [check]);

  useEffect(() => {
    const timer = setInterval(() => void check(), state.phase === 'maintenance' ? MAINTENANCE_POLL_MS : OPEN_POLL_MS);
    return () => clearInterval(timer);
  }, [check, state.phase]);

  return state;
}
