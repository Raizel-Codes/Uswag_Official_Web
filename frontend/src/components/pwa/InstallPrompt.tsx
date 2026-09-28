import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState, useEffect } from 'react';
import crestOnDark from '@/assets/images/logo-uswag-on-dark.svg';

const DISMISSED_KEY = 'uswag_install_prompt_dismissed';

// Public-site "Install USWAG" toast (rendered by PublicLayout). Styled as a small Deep Forest
// vault card with an inset Sage rule to match the public Record; text is ≥12px on Deep Forest.
export default function InstallPrompt() {
  const { canInstall, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Keep localStorage in sync
  useEffect(() => {
    if (dismissed) {
      try {
        localStorage.setItem(DISMISSED_KEY, 'true');
      } catch { /* ignore */ }
    }
  }, [dismissed]);

  if (!canInstall || dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Install the USWAG app"
      className="fixed left-4 right-4 bottom-24 z-40 md:left-auto md:right-6 md:w-[22rem] md:bottom-6 rounded-[3px] p-5 flex items-center gap-4 text-mist bg-forest bg-[radial-gradient(90%_120%_at_0%_0%,rgba(46,91,65,0.9),transparent_60%)] shadow-[inset_0_0_0_4px_rgba(20,39,24,1),inset_0_0_0_5px_rgba(152,203,176,0.45),0_18px_40px_-16px_rgba(20,39,24,0.6)]"
    >
      <img src={crestOnDark} alt="" width={44} height={36} className="shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="font-display text-[1rem] font-semibold leading-tight">Install USWAG</p>
        <p className="text-mist/85 text-[0.8125rem] leading-snug mt-1">
          Add it to your home screen for quick access &amp; push alerts.
        </p>
      </div>

      <div className="flex flex-col items-stretch gap-1.5 shrink-0">
        <button
          type="button"
          onClick={promptInstall}
          className="bg-mist text-forest text-[0.8125rem] font-semibold px-4 py-2 rounded-[3px] shadow-[inset_0_0_0_1px_rgba(20,39,24,0.2)] hover:bg-sage transition-colors"
        >
          Install
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-mist/80 hover:text-mist text-[0.75rem] font-semibold uppercase tracking-[0.1em] py-1.5 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
