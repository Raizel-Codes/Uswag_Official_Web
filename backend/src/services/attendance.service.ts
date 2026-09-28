import { prisma } from '../config/db.js';
import { verifyQrValue } from './qr.service.js';
import type { ScanResult } from '@prisma/client';

// Every scan attempt gets logged regardless of outcome — this is what
// makes a cloned QR detectable (same serial scanned in two places
// minutes apart shows up here). See claude.md "QR membership system".
export async function recordScan(rawQrValue: string, eventId: string, scannedByOfficerId: string) {
  const outcome = await verifyQrValue(rawQrValue);

  const resultMap: Record<typeof outcome.status, ScanResult> = {
    valid: 'VALID',
    invalid: 'INVALID',
    expired: 'EXPIRED',
  };

  const memberId = 'memberId' in outcome ? outcome.memberId : null;

  const record = await prisma.attendanceRecord.create({
    data: {
      eventId,
      memberId: memberId
        ? (await prisma.memberProfile.findUnique({ where: { userId: memberId } }))?.id
        : null,
      scannedByOfficerId,
      result: resultMap[outcome.status],
      reason: 'reason' in outcome ? outcome.reason : null,
    },
    include: { member: { include: { user: true } } },
  });

  return { outcome, record };
}

// ---------------------------------------------------------------------------
// GET /members/me/attendance — a member's own scan history.
// Read-only, self-scoped: the controller resolves userId from the JWT,
// never from a client-supplied param.
// ---------------------------------------------------------------------------
export async function getMemberAttendanceHistory(userId: string) {
  const profile = await prisma.memberProfile.findUnique({ where: { userId } });
  if (!profile) return null;

  const records = await prisma.attendanceRecord.findMany({
    where: { memberId: profile.id },
    orderBy: { scannedAt: 'desc' },
    include: { event: { select: { id: true, title: true, startsAt: true, pillar: true } } },
  });

  const validCount = records.filter((r) => r.result === 'VALID').length;

  return {
    records,
    totalScans: records.length,
    validScans: validCount,
    attendanceRate: records.length > 0 ? Math.round((validCount / records.length) * 100) : 0,
  };
}

// ---------------------------------------------------------------------------
// GET /attendance — Auditor oversight + Super Admin read access
// (Article VI: Auditor has read-only access to attendance records).
// ---------------------------------------------------------------------------
export async function listAttendanceRecords(filters: {
  eventId?: string;
  result?: ScanResult;
  search?: string;
  limit?: number;
}) {
  const { eventId, result, search, limit = 50 } = filters;

  return prisma.attendanceRecord.findMany({
    where: {
      eventId: eventId || undefined,
      result: result || undefined,
      member: search
        ? { user: { name: { contains: search, mode: 'insensitive' } } }
        : undefined,
    },
    orderBy: { scannedAt: 'desc' },
    take: limit,
    include: {
      event: { select: { id: true, title: true, startsAt: true } },
      member: { include: { user: { select: { id: true, name: true } } } },
      scannedByOfficer: { select: { id: true, name: true, officerPosition: true } },
    },
  });
}

// ---------------------------------------------------------------------------
// Batched per-member attendance rate — backs the `attendanceRate` field on
// the member DTO (see member.controller.ts toMemberDTO). One grouped query
// instead of N+1 so listMembers() stays cheap for a full roster.
// ---------------------------------------------------------------------------
export async function getAttendanceRatesByMember(
  memberIds: string[],
): Promise<Record<string, number>> {
  const rates: Record<string, number> = {};
  if (memberIds.length === 0) return rates;

  const grouped = await prisma.attendanceRecord.groupBy({
    by: ['memberId', 'result'],
    where: { memberId: { in: memberIds } },
    _count: true,
  });

  const totals: Record<string, { total: number; valid: number }> = {};
  for (const id of memberIds) totals[id] = { total: 0, valid: 0 };

  for (const g of grouped) {
    if (!g.memberId) continue;
    totals[g.memberId].total += g._count;
    if (g.result === 'VALID') totals[g.memberId].valid += g._count;
  }

  for (const id of memberIds) {
    const t = totals[id];
    rates[id] = t.total > 0 ? Math.round((t.valid / t.total) * 100) : 0;
  }

  return rates;
}

// ---------------------------------------------------------------------------
// Org-wide scan outcome stats — backs the "Avg. Attendance" KPI shown to
// the Auditor and on officer dashboards. Derived from real recorded scans
// (valid / total), not a cohort-eligibility model — see attendance
// controller for the caveat surfaced to the frontend.
// ---------------------------------------------------------------------------
export async function getAttendanceStats() {
  const [total, valid, invalid, expired] = await Promise.all([
    prisma.attendanceRecord.count(),
    prisma.attendanceRecord.count({ where: { result: 'VALID' } }),
    prisma.attendanceRecord.count({ where: { result: 'INVALID' } }),
    prisma.attendanceRecord.count({ where: { result: 'EXPIRED' } }),
  ]);

  return {
    totalScans: total,
    validScans: valid,
    invalidScans: invalid,
    expiredScans: expired,
    validRate: total > 0 ? Math.round((valid / total) * 100) : 0,
  };
}
