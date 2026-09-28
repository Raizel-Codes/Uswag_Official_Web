// QR payload and verification contracts.
// Signing/verification logic lives server-side — see backend/src/services/qr.service.ts.
// The frontend never validates a QR on its own; it only renders results
// returned by POST /api/v1/scan. See claude.md "QR membership system".

export interface QrPayload {
  memberId: string; // UUID, never sequential
  signature: string; // HMAC-SHA256, server-generated
  version: number;
}

export type ScanVerificationStatus = 'valid' | 'invalid' | 'expired';

export interface ScanVerificationResponse {
  status: ScanVerificationStatus;
  member?: {
    id: string;
    name: string;
    serialNumber: string;
    collegeOrDept: string;
  };
  reason?: string; // populated when status !== 'valid'
  scannedAt: string;
}
