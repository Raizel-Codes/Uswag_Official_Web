import type { Request, Response } from 'express';
import * as attendanceService from '../services/attendance.service.js';
import { ok, fail } from '../utils/response.js';

// ---------------------------------------------------------------------------
// GET /members/me/attendance
// Access: any authenticated member — self-scoped via req.user.id
// ---------------------------------------------------------------------------
export async function getMyAttendance(req: Request, res: Response) {
  const history = await attendanceService.getMemberAttendanceHistory(req.user!.id);
  if (!history) return fail(res, 'Member profile not found', 404);
  return ok(res, history);
}

// ---------------------------------------------------------------------------
// GET /attendance
// Access: Auditor (read-only, Article VI oversight) + Super Admin
// ---------------------------------------------------------------------------
export async function listAttendance(req: Request, res: Response) {
  const { eventId, result, search, limit } = req.query;

  const records = await attendanceService.listAttendanceRecords({
    eventId: eventId ? String(eventId) : undefined,
    result: result ? (String(result).toUpperCase() as any) : undefined,
    search: search ? String(search) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  return ok(res, records);
}

// ---------------------------------------------------------------------------
// GET /attendance/stats
// Access: Auditor + Super Admin (also consumed by officer dashboards)
// ---------------------------------------------------------------------------
export async function getStats(_req: Request, res: Response) {
  const stats = await attendanceService.getAttendanceStats();
  return ok(res, stats);
}
