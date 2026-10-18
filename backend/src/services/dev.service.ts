import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { getSyncStatus } from '../jobs/facebookSync.job.js';
import { getRenewalStatus } from '../jobs/memberRenewal.job.js';
import { isFacebookConfigured } from './facebook.service.js';
import { isEmailConfigured } from './email.service.js';
import { recentErrors } from '../utils/errorBuffer.js';
import { getMaintenance } from './maintenance.service.js';

// Everything the developer's /dev console can ask for. Read-only by construction: each command is a
// fixed query, nothing takes SQL or a shell command, and nothing returns a secret (settings are
// reported as set / not set, never their values).

export async function status() {
  const started = Date.now();
  let db: { ok: true; latencyMs: number } | { ok: false; error: string };
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = { ok: true, latencyMs: Date.now() - started };
  } catch (err) {
    db = { ok: false, error: err instanceof Error ? err.message.slice(0, 200) : 'unknown' };
  }
  return {
    time: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    node: process.version,
    environment: env.nodeEnv,
    // Set by Render on every deploy; absent locally.
    commit: process.env.RENDER_GIT_COMMIT?.slice(0, 7) ?? null,
    memoryMb: Math.round(process.memoryUsage().rss / 1_048_576),
    maintenance: await getMaintenance(),
    db,
  };
}

export async function users() {
  const [roles, standings, awaitingSetup, pushDevices, events, auditEntries, openResets] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.memberProfile.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.user.count({ where: { awaitingPasswordSetup: true } }),
    prisma.pushSubscription.count(),
    prisma.uswagEvent.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.auditLogEntry.count(),
    prisma.user.count({ where: { passwordResetRequestedAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
  ]);
  const tally = <T extends string>(rows: { _count: { _all: number } }[], key: (i: number) => T) => Object.fromEntries(rows.map((r, i) => [key(i), r._count._all]));
  return {
    accountsByRole: tally(roles, (i) => roles[i]!.role),
    membersByStanding: tally(standings, (i) => standings[i]!.status),
    eventsByStatus: tally(events, (i) => events[i]!.status),
    awaitingPasswordSetup: awaitingSetup,
    pushDevices,
    auditEntries,
    openResetRequests: openResets,
  };
}

export async function audit(limit = 20) {
  const rows = await prisma.auditLogEntry.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(limit, 1), 100),
    include: { actor: { select: { name: true, role: true } } },
  });
  return rows.map((r) => ({ at: r.createdAt, actor: r.actor.name, role: r.actor.role, action: r.action, target: r.targetType ?? null }));
}

export function jobs() {
  return {
    facebookSync: { configured: isFacebookConfigured(), schedule: 'every 30 min', ...getSyncStatus() },
    membershipRenewal: { schedule: 'daily 00:10 Asia/Manila, and at boot', ...getRenewalStatus() },
  };
}

export function config() {
  return {
    environment: env.nodeEnv,
    frontendOrigin: env.frontendOrigin,
    facebookSync: isFacebookConfigured(),
    email: isEmailConfigured(),
    webPush: Boolean(env.vapid.publicKey && env.vapid.privateKey),
  };
}

export function errors(limit = 20) {
  return recentErrors(Math.min(Math.max(limit, 1), 100));
}
