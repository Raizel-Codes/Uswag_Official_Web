import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerCameraProps {
  onDecoded: (rawValue: string) => void;
  active: boolean;
}

// Wraps html5-qrcode's camera lifecycle. Pair with hooks/useQRScanner.ts
// for the verification call. See prototype/officer-admin.html and
// prototype/super-admin.html Scan Console for the visual frame this
// should render inside (corner brackets + scan line overlay).
export default function QRScannerCamera({ onDecoded, active }: QRScannerCameraProps) {
  const containerId = 'qr-reader';
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!active) return;
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        (decodedText) => onDecoded(decodedText),
        () => {
          /* ignore per-frame decode failures */
        },
      )
      .catch((err) => console.error('QR scanner failed to start', err));

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [active, onDecoded]);

  return <div id={containerId} className="w-full aspect-square rounded-2xl overflow-hidden bg-forest" />;
}
