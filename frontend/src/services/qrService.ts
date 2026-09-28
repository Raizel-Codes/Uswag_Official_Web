import { api } from './api';
import type { ScanVerificationResponse } from '@/types/qr.types';

// The frontend only ever submits a raw scanned QR string for server-side
// verification. Signature checking happens in the backend — see
// backend/src/services/qr.service.ts. Do not add client-side validation
// logic here that could be used to bypass a live check.

export async function verifyScan(rawQrValue: string, eventId: string): Promise<ScanVerificationResponse> {
  const { data } = await api.post<ScanVerificationResponse>('/scan', { rawQrValue, eventId });
  return data;
}

export async function getMyDigitalCard(): Promise<{ qrValue: string; serialNumber: string }> {
  const { data } = await api.get('/members/me/qr');
  return data;
}
