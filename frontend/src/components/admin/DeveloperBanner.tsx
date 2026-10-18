import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Reminder at the top of every console page for the developer's account: it sees what the Super Admin
// sees, and the server refuses every change (auth.middleware.ts). Renders nothing for anyone else.
export default function DeveloperBanner() {
  const { user } = useAuth();
  if (!user?.isDeveloper) return null;
  return (
    <div role="note" aria-label="Developer view" className="relative z-[1] bg-forest text-mist border-b border-sage/30">
      <p className="max-w-[1200px] mx-auto px-4 sm:px-8 py-2.5 text-[0.8125rem] leading-snug flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <span className="font-semibold uppercase tracking-[0.12em] text-[0.6875rem] px-2 py-0.5 rounded-[3px] bg-sage text-forest">Developer</span>
        <span>View only: you can see everything here and change nothing.</span>
        <Link to="/dev" className="font-semibold underline underline-offset-2 decoration-sage">Open the console</Link>
      </p>
    </div>
  );
}
