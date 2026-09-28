import { Link } from 'react-router-dom';
import Logo from '@/components/common/Logo';

const ORG_LINKS = [
  { to: '/about', label: 'About USWAG' },
  { to: '/advocacies', label: 'Advocacies' },
  { to: '/officers', label: 'Officers' },
  { to: '/bylaws', label: 'Constitution & By-Laws' },
];

const ENGAGE_LINKS = [
  { to: '/events', label: 'Events' },
  { to: '/news', label: 'News & Updates' },
  { to: '/join', label: 'Join Us' },
  { to: '/contact', label: 'Contact' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-forest text-white/60 pt-14 pb-10 px-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-[1fr_1fr_1fr] gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <Logo variant="onDark" size={32} />
            </div>
            <p className="text-[13px] leading-relaxed text-white/55 max-w-[260px]">
              United Students Working for Advocacy and Growth — Northwest Samar State University, Main Campus, Calbayog City, Samar 6710.
            </p>
          </div>

          {/* Organization links */}
          <div>
            <h5 className="text-[11.5px] font-bold text-white uppercase tracking-widest mb-4 font-body">
              Organization
            </h5>
            <ul className="space-y-2.5">
              {ORG_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-[13px] text-white/55 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Engage links */}
          <div>
            <h5 className="text-[11.5px] font-bold text-white uppercase tracking-widest mb-4 font-body">
              Connect
            </h5>
            <ul className="space-y-2.5">
              {ENGAGE_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-[13px] text-white/55 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://www.facebook.com/share/1FkuYoYfnN/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-white/55 hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.56 1.52-3.98 3.86-3.98 1.12 0 2.3.2 2.3.2v2.5h-1.3c-1.28 0-1.68.79-1.68 1.6V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0 0 22 12Z" />
                  </svg>
                  Facebook Page
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-[11.5px] text-white/40">
            © {year} USWAG · Northwest Samar State University
          </p>
          <p className="text-[11.5px] text-white/30">
            Governed by the USWAG Constitution &amp; By-Laws
          </p>
        </div>
      </div>
    </footer>
  );
}
