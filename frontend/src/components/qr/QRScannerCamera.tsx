import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerCameraProps {
  onDecoded: (rawValue: string) => void;
  active: boolean;
  /** The camera couldn't start (permission refused, no camera, in use elsewhere). */
  onError?: (message: string) => void;
}

const containerId = 'qr-reader';

function cameraMessage(err: unknown): string {
  const text = String((err as { message?: string })?.message ?? err);
  if (/permission|denied|notallowed/i.test(text)) return 'Camera access was blocked. Allow the camera for this site in your browser, then start scanning again.';
  if (/notfound|no camera|requested device/i.test(text)) return 'No camera was found on this device.';
  if (/timeout|abort/i.test(text)) return 'The camera took too long to start. Close any other app or tab using the camera, then start scanning again.';
  if (/notreadable|in use|could not start/i.test(text)) return 'The camera is busy in another app or tab. Close it there, then start scanning again.';
  return 'The camera couldn’t start. Reload the page and try again.';
}

// Wraps html5-qrcode's camera lifecycle. Pair with hooks/useQRScanner.ts
// for the verification call. See prototype/officer-admin.html and
// prototype/super-admin.html Scan Console for the visual frame this
// should render inside (corner brackets + scan line overlay).
//
// Two things keep the picture steady. (1) The camera is started and stopped ONLY when `active`
// flips: the decode callback lives in a ref, because an effect that also depended on it tore the
// camera down and rebuilt it every time the parent re-rendered, i.e. at every decode and every
// "Verifying…" change, and each rebuild blanked the view (the white flash). (2) start and stop never
// overlap: html5-qrcode refuses a new start while the last stop is still finishing, which used to
// leave an empty view until the page was reloaded.
export default function QRScannerCamera({ onDecoded, active, onError }: QRScannerCameraProps) {
  const onDecodedRef = useRef(onDecoded);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onDecodedRef.current = onDecoded;
    onErrorRef.current = onError;
  });
  // The camera work in flight (a start, or a stop): the next start waits for it.
  const queue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    const started = queue.current.then(async () => {
      if (cancelled) return;
      scanner = new Html5Qrcode(containerId);
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 240 },
          (decodedText) => onDecodedRef.current(decodedText),
          () => {
            /* ignore per-frame decode failures */
          },
        );
      } catch (err) {
        console.error('QR scanner failed to start', err);
        scanner = null;
        if (!cancelled) onErrorRef.current?.(cameraMessage(err));
      }
    });
    queue.current = started;

    return () => {
      cancelled = true;
      // Stop only once the start has settled, and let the next start wait for the stop.
      queue.current = started.then(async () => {
        try {
          if (scanner?.isScanning) await scanner.stop();
          scanner?.clear();
        } catch {
          /* already stopped */
        }
      });
    };
  }, [active]);

  return <div id={containerId} className="w-full aspect-square overflow-hidden bg-forest" />;
}
