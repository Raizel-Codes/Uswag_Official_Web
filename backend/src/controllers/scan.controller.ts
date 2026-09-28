import type { Request, Response } from 'express';
import { recordScan } from '../services/attendance.service.js';
import { ok } from '../utils/response.js';

// This is the endpoint QRScannerCamera.tsx hits on every decoded frame.
// Always returns 200 with a status field (valid/invalid/expired) rather
// than a 4xx — an invalid scan is an expected, well-formed outcome,
// not a client error.
export async function verifyScan(req: Request, res: Response) {
  const { rawQrValue, eventId } = req.body;
  const { outcome, record } = await recordScan(rawQrValue, eventId, req.user!.id);
  return ok(res, { status: outcome.status, reason: 'reason' in outcome ? outcome.reason : undefined, scannedAt: record.scannedAt, member: record.member?.user });
}
