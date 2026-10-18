import { Link } from 'react-router-dom';
import { IS_BETA } from '@/config/release';

// "This is the beta" notice (config/release.ts). Sits in the normal page flow at the top of the
// content, public site and both portals alike (PublicLayout, PortalShell), so it scrolls away
// instead of taking fixed or sticky space from the header, the sidebar or the tab bar. Renders
// nothing once the build is no longer a beta. `relative z-[1]`: public page mastheads pull themselves
// up by the header's height (-mt-[76px]) to slide under it, which would otherwise paint over this.
export default function BetaBanner() {
  if (!IS_BETA) return null;
  return (
    <div role="note" aria-label="Beta version" className="relative z-[1] bg-warnBg text-forest border-b border-warn/40">
      <p className="max-w-[1200px] mx-auto px-4 sm:px-8 py-2.5 text-[0.8125rem] leading-snug flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <span className="font-semibold uppercase tracking-[0.12em] text-[0.6875rem] px-2 py-0.5 rounded-[3px] bg-forest text-mist">Beta</span>
        <span className="sm:hidden">Testing phase: some details may still change.</span>
        <span className="hidden sm:inline">
          This is the beta version, in its testing phase. Some information is still being confirmed and may change before the official launch.
        </span>
        <Link to="/contact" className="font-semibold underline underline-offset-2 decoration-warn hover:decoration-forest">
          Report a problem
        </Link>
      </p>
    </div>
  );
}
