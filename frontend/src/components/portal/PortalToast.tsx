import type { PortalToastState } from '@/hooks/usePortalToast';

/** Status message pinned above the tab bar (phones) or top-right (desktop). Announced politely. */
export default function PortalToast({ toast }: { toast: PortalToastState | null }) {
  return (
    <div className="ap-toast-region" role="status" aria-live="polite">
      {toast && (
        <div className={`ap-toast mp-vault mp-on-dark ${toast.tone === 'error' ? 'ap-toast--error' : ''}`}>
          <span className="ap-toast__mark" aria-hidden="true">
            {toast.tone === 'error' ? '!' : '✓'}
          </span>
          {toast.message}
        </div>
      )}
    </div>
  );
}
