import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { logAction } from './audit.service.js';

// The site-wide maintenance switch (model SiteMaintenance: one row). Only the developer's account turns it
// on or off (dev.routes.ts, scripts/maintenance.ts); while it is on, middlewares/maintenance.middleware.ts
// answers every request except the status check, /health and the developer's own with 503.
//
// - Stored in the database so it survives the server restart a deploy causes.
// - Read through a short in-memory cache (a few seconds), so the gate costs a lookup per few seconds, not
//   per request. A change made on this server shows at once; on a second server it takes up to the TTL.
// - If the database can't be read the last known answer is kept, and with none the site stays OPEN: a
//   maintenance flag that locks everyone out because the database blinked would be worse than no flag.
// - endsAt is only an estimate shown on the page. Nothing here reopens the site when it passes.

export interface MaintenanceState {
  enabled: boolean;
  startedAt: string | null;
  endsAt: string | null;
  message: string | null;
}

export const DEFAULT_MINUTES = 60;
export const MIN_MINUTES = 5;
export const MAX_MINUTES = 12 * 60;
const MAX_MESSAGE = 200;
const CACHE_MS = 5_000;

const OFF: MaintenanceState = { enabled: false, startedAt: null, endsAt: null, message: null };

let cached: { state: MaintenanceState; at: number } | null = null;

export class MaintenanceError extends Error {
  constructor(message: string, readonly status = 400, readonly details?: unknown) {
    super(message);
  }
}

function toState(row: { enabled: boolean; startedAt: Date | null; endsAt: Date | null; message: string | null } | null): MaintenanceState {
  if (!row || !row.enabled) return OFF;
  return { enabled: true, startedAt: row.startedAt?.toISOString() ?? null, endsAt: row.endsAt?.toISOString() ?? null, message: row.message };
}

export async function getMaintenance(): Promise<MaintenanceState> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.state;
  try {
    const state = toState(await prisma.siteMaintenance.findUnique({ where: { id: 1 } }));
    cached = { state, at: Date.now() };
    return state;
  } catch (err) {
    logger.error('Could not read the maintenance switch', err);
    return cached?.state ?? OFF;
  }
}

function clampMinutes(minutes: number | undefined) {
  const m = Math.round(minutes ?? DEFAULT_MINUTES);
  if (!Number.isFinite(m) || m < MIN_MINUTES || m > MAX_MINUTES) {
    throw new MaintenanceError(`Choose between ${MIN_MINUTES} and ${MAX_MINUTES} minutes.`, 400);
  }
  return m;
}

const cleanMessage = (message: string | undefined) => {
  const text = (message ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_MESSAGE);
  return text || null;
};

async function save(actorId: string, data: { enabled: boolean; startedAt: Date | null; endsAt: Date | null; message: string | null }) {
  const row = await prisma.siteMaintenance.upsert({
    where: { id: 1 },
    create: { id: 1, ...data, setById: actorId },
    update: { ...data, setById: actorId },
  });
  cached = { state: toState(row), at: Date.now() };
  return cached.state;
}

/** Scans recorded recently: turning maintenance on would drop the ones in flight at an event. */
export const recentScanCount = (minutes = 10) =>
  prisma.attendanceRecord.count({ where: { scannedAt: { gt: new Date(Date.now() - minutes * 60_000) } } });

export async function turnOn(actorId: string, opts: { minutes?: number; message?: string; force?: boolean }) {
  const current = await getMaintenance();
  if (current.enabled) throw new MaintenanceError('Maintenance is already on. Use "maintenance extend" to give it more time, or "maintenance off".', 409);

  const minutes = clampMinutes(opts.minutes);
  if (!opts.force) {
    const scans = await recentScanCount();
    if (scans > 0) {
      throw new MaintenanceError(
        `${scans} scan${scans === 1 ? '' : 's'} ${scans === 1 ? 'was' : 'were'} recorded in the last 10 minutes, so an event may be running. Maintenance stops scanning for everyone. Run it again with --force if you're sure.`,
        409,
        { recentScans: scans },
      );
    }
  }
  const now = new Date();
  const message = cleanMessage(opts.message);
  const state = await save(actorId, { enabled: true, startedAt: now, endsAt: new Date(now.getTime() + minutes * 60_000), message });
  await logAction(actorId, 'maintenance.on', 'Site', undefined, { minutes, endsAt: state.endsAt, message });
  return state;
}

export async function turnOff(actorId: string) {
  const current = await getMaintenance();
  if (!current.enabled) throw new MaintenanceError('Maintenance is already off.', 409);
  const startedAt = current.startedAt ? new Date(current.startedAt).getTime() : null;
  const state = await save(actorId, { enabled: false, startedAt: null, endsAt: null, message: null });
  await logAction(actorId, 'maintenance.off', 'Site', undefined, { minutesOn: startedAt ? Math.round((Date.now() - startedAt) / 60_000) : null });
  return state;
}

/** Moves the estimated end time later (from now if it has already passed). */
export async function extend(actorId: string, minutes: number) {
  const current = await getMaintenance();
  if (!current.enabled) throw new MaintenanceError('Maintenance is off. Use "maintenance on" first.', 409);
  const add = clampMinutes(minutes);
  const base = Math.max(Date.now(), current.endsAt ? new Date(current.endsAt).getTime() : 0);
  const state = await save(actorId, {
    enabled: true,
    startedAt: current.startedAt ? new Date(current.startedAt) : new Date(),
    endsAt: new Date(base + add * 60_000),
    message: current.message,
  });
  await logAction(actorId, 'maintenance.extend', 'Site', undefined, { addedMinutes: add, endsAt: state.endsAt });
  return state;
}
