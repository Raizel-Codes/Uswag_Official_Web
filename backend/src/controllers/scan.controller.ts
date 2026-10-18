import type { Request, Response } from 'express';
import { recordScan } from '../services/attendance.service.js';
import { verifyOfficerQrValue } from '../services/qr.service.js';
import { logAction } from '../services/audit.service.js';
import { ok } from '../utils/response.js';

// This is the endpoint QRScannerCamera.tsx hits on every decoded frame.
// Always returns 200 with a status field (valid/invalid/expired) rather
// than a 4xx — an invalid scan is an expected, well-formed outcome,
// not a client error.
//
// Two payload shapes come through here (see qr.service.ts): a member card
// (USWAG-MEMBER:…) is checked against an event and logged as an
// AttendanceRecord, same as always. An officer's own ID (USWAG-OFFICER:…) —
// for meetings and forums an officer conducts — verifies identity only: no
// event is required, and nothing is written to AttendanceRecord (that table
// is scoped to UswagEvent/advocacy attendance). The check is instead logged
// to the audit trail, for accountability without misusing the event model.
//
// The console sends no eventId while it's in "officer ID check" mode (see
// ScanConsolePage.tsx) — so anything decoded there that ISN'T an officer ID
// is a plain invalid result, not a request error: still a well-formed,
// expected outcome, not something to fail() on.
export async function verifyScan(req: Request, res: Response) {
  const { rawQrValue, eventId } = req.body;
  const isOfficerPayload = typeof rawQrValue === 'string' && rawQrValue.startsWith('USWAG-OFFICER:');

  if (isOfficerPayload) {
    const outcome = await verifyOfficerQrValue(rawQrValue);
    await logAction(
      req.user!.id,
      'scan.officer_verify',
      'User',
      outcome.status === 'valid' ? outcome.officerId : undefined,
      { result: outcome.status },
    );
    return ok(res, {
      status: outcome.status,
      reason: 'reason' in outcome ? outcome.reason : undefined,
      scannedAt: new Date().toISOString(),
      // lowercase to match how officerPosition is cased everywhere else the client sees it
      // (auth.controller.ts's toAuthSession, memberSchemas.ts, etc.)
      officer: outcome.status === 'valid' ? { name: outcome.name, officerPosition: outcome.officerPosition?.toLowerCase() ?? null } : undefined,
    });
  }

  if (!eventId) {
    return ok(res, { status: 'invalid', reason: 'This QR code isn’t an officer ID.', scannedAt: new Date().toISOString() });
  }

  const { outcome, record, checkedInAt } = await recordScan(rawQrValue, eventId, req.user!.id);
  const member = record.member;
  return ok(res, {
    status: outcome.status,
    reason: 'reason' in outcome ? outcome.reason : undefined,
    scannedAt: record.scannedAt,
    // Set when this card was already checked in to the event: the time of the first scan. The
    // status stays 'valid' (the card is good); it just isn't counted again.
    ...(checkedInAt ? { alreadyCheckedIn: true, checkedInAt } : {}),
    // Only what the scan console shows. Never the User row itself: it carries the password
    // hash, the reset-token hash and the session version.
    member: member
      ? { id: member.id, name: member.user.name, serialNumber: member.serialNumber, collegeOrDept: member.user.collegeOrDept }
      : undefined,
  });
}
