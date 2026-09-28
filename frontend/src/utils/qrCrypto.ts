// Client-side helpers ONLY for rendering/parsing QR payload shape.
// This file must never contain signature-verification logic — that
// would imply trusting a client-side check for something security-relevant.
// See claude.md "QR membership system": verification always happens
// server-side via POST /api/v1/scan.

export function encodeQrDisplayValue(memberId: string, signature: string, version = 1): string {
  return `USWAG-MEMBER:UUID=${memberId}:SIG=${signature}:V=${version}`;
}
