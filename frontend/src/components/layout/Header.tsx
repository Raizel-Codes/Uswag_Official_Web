import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import Logo from '@/components/common/Logo';

// Public-site header (PublicLayout only — portals use DashboardLayout/Sidebar).
// Styled to match the public "Record": small-caps nav with a drawn underline, an engraved
// double rule when scrolled, and square, hairline-framed buttons instead of pills.
const NAV_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/advocacies', label: 'Advocacies' },
  { to: '/officers', label: 'Officers' },
  { to: '/events', label: 'Events' },
  { to: '/news', label: 'News' },
  { to: '/join', label: 'Join' },
];

const PRIMARY_BTN =
  'inline-flex items-center justify-center bg-forest text-mist font-semibold rounded-[3px] shadow-[inset_0_0_0_1px_rgba(152,203,176,0.4)] hover:bg-primary transition-colors';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuthContext();
  const location = useLocation();

  // Scroll-aware shrink
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Escape closes the mobile menu
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const dashboardPath = user ? (user.role === 'member' ? '/dashboard' : '/admin') : '/login';

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `group relative py-2 text-[0.75rem] font-semibold uppercase tracking-[0.14em] transition-colors hover:text-primary ${
      isActive ? 'text-primary' : 'text-forest'
    }`;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-3 bg-mist/90 backdrop-blur-xl shadow-[0_1px_0_rgba(20,39,24,0.14),0_4px_0_-3px_rgba(152,203,176,0.9),0_14px_30px_-20px_rgba(20,39,24,0.35)]'
            : 'py-5 bg-transparent'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 flex items-center justify-between gap-6">
          <Link to="/" className="group rounded-[3px]" aria-label="USWAG — front page">
            <Logo size={36} className="transition-transform duration-300 group-hover:-rotate-3" />
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Main" className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} className={linkCls}>
                {({ isActive }) => (
                  <>
                    {label}
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 right-0 bottom-0.5 h-px bg-current origin-left transition-transform duration-300 ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              to={dashboardPath}
              className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-forest hover:text-primary transition-colors py-2"
            >
              {user ? 'Dashboard' : 'Log in'}
            </Link>
            {!user && (
              <Link to="/join" className={`${PRIMARY_BTN} text-[0.8125rem] px-5 py-2.5`}>
                Join USWAG
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden w-11 h-11 flex flex-col items-center justify-center gap-[5px] rounded-[3px] hover:bg-forest/5 transition-colors"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <span className={`block w-5 h-0.5 bg-forest transition-all duration-200 ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`block w-5 h-0.5 bg-forest transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-forest transition-all duration-200 ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-forest/30 backdrop-blur-sm" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <div
            id="mobile-menu"
            className="fixed top-0 right-0 bottom-0 z-50 w-[min(20rem,86vw)] bg-mist border-l border-forest/15 shadow-[inset_4px_0_0_-3px_rgba(152,203,176,0.9),-20px_0_40px_-20px_rgba(20,39,24,0.45)] flex flex-col pt-24 pb-8 px-6 overflow-y-auto"
          >
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-forest/75 mb-3">The Record</p>
            <nav aria-label="Main" className="flex flex-col border-t border-forest/15">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center justify-between py-3.5 border-b border-forest/15 font-display text-[1.25rem] transition-colors ${
                      isActive ? 'text-primary' : 'text-forest hover:text-primary'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {label}
                      {isActive && <span aria-hidden="true" className="w-2 h-2 rotate-45 bg-primary" />}
                    </>
                  )}
                </NavLink>
              ))}
              <NavLink
                to="/bylaws"
                className={({ isActive }) =>
                  `py-3.5 border-b border-forest/15 text-[0.9375rem] font-medium transition-colors ${isActive ? 'text-primary' : 'text-forest hover:text-primary'}`
                }
              >
                Constitution &amp; By-Laws
              </NavLink>
              <NavLink
                to="/contact"
                className={({ isActive }) =>
                  `py-3.5 border-b border-forest/15 text-[0.9375rem] font-medium transition-colors ${isActive ? 'text-primary' : 'text-forest hover:text-primary'}`
                }
              >
                Contact
              </NavLink>
            </nav>
            <div className="flex flex-col gap-3 mt-8">
              {!user && (
                <Link to="/join" className={`${PRIMARY_BTN} w-full py-3.5 text-[0.9375rem]`}>
                  Join USWAG
                </Link>
              )}
              <Link
                to={dashboardPath}
                className="w-full text-center py-3.5 rounded-[3px] border border-forest/30 text-forest font-semibold text-[0.9375rem] hover:border-forest transition-colors"
              >
                {user ? 'Go to dashboard' : 'Log in'}
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Spacer so content isn't hidden under the fixed header */}
      <div className="h-[68px] md:h-[76px]" />
    </>
  );
}
