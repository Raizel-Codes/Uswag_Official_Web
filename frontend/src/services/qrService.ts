import { api } from './api';
import type { ScanVerificationResponse } from '@/types/qr.types';

// The frontend only ever submits a raw scanned QR string for server-side
// verification. Signature checking happens in the backend — see
// backend/src/services/qr.service.ts. Do not add client-side validation
// logic here that could be used to bypass a live check.

// eventId is required to scan a member's card (the server refuses without one) but not for an
// officer's own ID — that verifies identity only and isn't tied to a UswagEvent.
export async function verifyScan(rawQrValue: string, eventId?: string): Promise<ScanVerificationResponse> {
  const { data } = await api.post<{ success: boolean; data: ScanVerificationResponse }>('/scan', { rawQrValue, eventId });
  return data.data;
}

// Active members only — the server answers 403 (ForbiddenError, with the reason) for
// pending, expired and rejected members, and never generates their QR.
export async function getMyDigitalCard(): Promise<{ qrValue: string; serialNumber: string }> {
  const { data } = await api.get<{ success: boolean; data: { qrValue: string; serialNumber: string } }>('/members/me/qr');
  return data.data;
}

// Any officer — their own signed identity QR, for meetings and forums they conduct.
export async function getMyOfficerQr(): Promise<{ qrValue: string }> {
  const { data } = await api.get<{ success: boolean; data: { qrValue: string } }>('/officers/me/qr');
  return data.data;
}
