import { useCallback, useEffect, useRef, useState } from 'react';

export interface PortalToastState {
  message: string;
  tone: 'ok' | 'error';
}

/**
 * A short confirmation / error message for portal pages (render it with <PortalToast>).
 * Replaces the per-page toast copies and the blocking alert() calls.
 */
export function usePortalToast(durationMs = 3500) {
  const [toast, setToast] = useState<PortalToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback(
    (message: string, tone: PortalToastState['tone'] = 'ok') => {
      clearTimeout(timer.current);
      setToast({ message, tone });
      timer.current = setTimeout(() => setToast(null), durationMs);
    },
    [durationMs]
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toast, show };
}
