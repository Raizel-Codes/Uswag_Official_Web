import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { useSiteStatus } from '@/hooks/useSiteStatus';
import MaintenancePage, { formatExpectedBack } from './MaintenancePage';

// Wraps the whole app. While the site is in maintenance everyone sees the maintenance page instead of it,
// except:
//   - /login, reachable by typing the address (there is deliberately no link to it from the page). Anyone
//     can open it; only the developer's credentials get past the server (maintenance.middleware.ts), so
//     it is the way in for the developer and a dead end for everyone else.
//   - the developer, signed in: they see the real site with a "maintenance is on" strip on top.
// The server is what actually locks the site (503 on every API call); this is its friendly face. People
// who were signed in stay signed in underneath it: nothing here touches the session.
export default function MaintenanceGate({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuthContext();
  const { pathname } = useLocation();
  const site = useSiteStatus();

  if (isLoading) return null; // the first tick: reading the saved session, so the developer never flashes the page

  if (site.phase === 'maintenance') {
    if (user?.isDeveloper) {
      return (
        <>
          {pathname !== '/dev' && (
            <div role="status" className="relative z-[2] bg-forest text-mist border-b border-sage/30">
              <p className="max-w-[1200px] mx-auto px-4 sm:px-8 py-2.5 text-[0.8125rem] leading-snug flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
                <span className="font-semibold uppercase tracking-[0.12em] text-[0.6875rem] px-2 py-0.5 rounded-[3px] bg-warn text-forest">Maintenance on</span>
                <span>Everyone else sees the maintenance page{site.info?.endsAt ? ` until about ${formatExpectedBack(new Date(site.info.endsAt))}` : ''}.</span>
                <Link to="/dev" className="font-semibold underline underline-offset-2 decoration-sage">Open the console to turn it off</Link>
              </p>
            </div>
          )}
          {children}
        </>
      );
    }
    if (pathname !== '/login') return <MaintenancePage info={site.info} offsetMs={site.offsetMs} />;
  }
  return <>{children}</>;
}
