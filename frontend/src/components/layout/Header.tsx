import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import Logo from '@/components/common/Logo';

const NAV_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/advocacies', label: 'Advocacies' },
  { to: '/officers', label: 'Officers' },
  { to: '/events', label: 'Events' },
  { to: '/news', label: 'News' },
  { to: '/join', label: 'Join' },
];

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
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `relative text-[13.5px] font-medium text-forest pb-0.5 transition-colors hover:text-primary group ${
      isActive ? 'text-primary' : ''
    }`;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-3 bg-mist/85 backdrop-blur-xl shadow-[0_1px_0_rgba(20,39,24,0.08),0_4px_24px_rgba(20,39,24,0.06)]'
            : 'py-5 bg-transparent'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="group">
            <Logo size={36} className="transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} className={linkCls}>
                {label}
                <span className="absolute bottom-0 left-0 w-full h-px bg-primary scale-x-0 origin-right transition-transform duration-200 group-hover:scale-x-100 group-hover:origin-left" />
              </NavLink>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link
                to={user.role === 'member' ? '/dashboard' : '/admin'}
                className="bg-forest text-white text-[13px] font-bold px-5 py-2 rounded-full hover:bg-primary transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[13.5px] font-medium text-forest hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/join"
                  className="bg-forest text-white text-[13px] font-bold px-5 py-2 rounded-full hover:bg-primary transition-colors"
                >
                  Join USWAG
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-lg hover:bg-forest/5 transition-colors"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span
              className={`block w-5 h-0.5 bg-forest rounded-full transition-all duration-200 ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`}
            />
            <span
              className={`block w-5 h-0.5 bg-forest rounded-full transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`}
            />
            <span
              className={`block w-5 h-0.5 bg-forest rounded-full transition-all duration-200 ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`}
            />
          </button>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-forest/20 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col pt-20 pb-8 px-6 overflow-y-auto">
            <nav className="flex flex-col gap-1 mb-8">
              {NAV_LINKS.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `py-3 px-3 rounded-xl font-medium text-[15px] transition-colors ${
                      isActive
                        ? 'bg-mist text-primary font-semibold'
                        : 'text-forest hover:bg-gray-50'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="flex flex-col gap-3 border-t border-forest/10 pt-6">
              {user ? (
                <Link
                  to={user.role === 'member' ? '/dashboard' : '/admin'}
                  className="w-full bg-forest text-white text-center py-3.5 rounded-[14px] font-bold text-[14.5px]"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/join"
                    className="w-full bg-forest text-white text-center py-3.5 rounded-[14px] font-bold text-[14.5px]"
                  >
                    Join USWAG
                  </Link>
                  <Link
                    to="/login"
                    className="w-full border border-forest/20 text-forest text-center py-3.5 rounded-[14px] font-bold text-[14.5px] hover:bg-mist transition-colors"
                  >
                    Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Spacer so content isn't hidden under fixed header */}
      <div className="h-[68px] md:h-[76px]" />
    </>
  );
}
