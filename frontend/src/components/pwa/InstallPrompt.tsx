import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'uswag_install_prompt_dismissed';

// See prototype/member.html "install-toast" for the reference visual
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
    <div className="fixed left-4 right-4 bottom-24 bg-forest text-white rounded-2xl p-4 flex items-center gap-4 shadow-[0_10px_30px_rgba(20,39,24,0.3)] z-40 md:left-auto md:right-6 md:w-80 md:bottom-6 border border-white/10">
      {/* Icon */}
      <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 16 16" width="20" height="20" fill="none">
          <path d="M8 2L3 5.5V13h4v-3.5h2V13h4V5.5L8 2z" fill="white" fillOpacity=".9" />
        </svg>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <b className="block text-[13.5px] font-display mb-0.5">Install USWAG</b>
        <span className="text-white/75 text-[11.5px] leading-snug block">
          Add to your home screen for quick access &amp; push alerts
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 shrink-0">
        <button
          onClick={promptInstall}
          className="bg-white text-forest text-[11.5px] font-bold px-3.5 py-1.5 rounded-lg hover:bg-sage transition-colors"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/50 hover:text-white text-[10px] font-semibold transition-colors uppercase tracking-wider text-center"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
