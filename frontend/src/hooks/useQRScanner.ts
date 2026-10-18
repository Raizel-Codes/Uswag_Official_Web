import { useState, useCallback, useRef } from "react";
import * as qrService from "@/services/qrService";
import type { ScanVerificationResponse } from "@/types/qr.types";

// Pairs with QRScannerCamera.tsx.
// After a successful decode the hook debounces further decodes for 3 s so a
// single physical QR code doesn't trigger multiple API calls.
// Call reset() to clear the last result and allow the next scan immediately.
// eventId is omitted when checking an officer's own ID (not tied to an event).
export function useQRScanner(eventId?: string) {
  const [result, setResult] = useState<ScanVerificationResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cooldownRef = useRef(false);
  // A ref, not the isVerifying state: reading the state made handleDecoded a new function at every
  // verification, and a new callback is what used to make the camera restart (see QRScannerCamera).
  const verifyingRef = useRef(false);

  const handleDecoded = useCallback(
    async (rawValue: string) => {
      // Skip if we are already in a cooldown window or actively verifying
      if (cooldownRef.current || verifyingRef.current) return;
      cooldownRef.current = true;
      verifyingRef.current = true;

      setIsVerifying(true);
      setError(null);
      try {
        const res = await qrService.verifyScan(rawValue, eventId);
        setResult(res);
      } catch (err: unknown) {
        // The server's reason when there is one (e.g. the Auditor's 403), else a network hint.
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        setError(e?.response?.data?.message ?? e?.message ?? "Network error — check your connection");
      } finally {
        verifyingRef.current = false;
        setIsVerifying(false);
        // Hold the cooldown for 3 s so the same QR code is not re-submitted
        // before the officer has had a chance to read the result.
        setTimeout(() => {
          cooldownRef.current = false;
        }, 3000);
      }
    },
    [eventId],
  );

  function reset() {
    setResult(null);
    setError(null);
    cooldownRef.current = false;
  }

  return { result, isVerifying, error, handleDecoded, reset };
}
