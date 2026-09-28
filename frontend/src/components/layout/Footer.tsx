import { Link } from 'react-router-dom';
import Logo from '@/components/common/Logo';
import { CHAPTERS } from '@/components/landing/chapters';
import { FOUNDED_YEAR } from '@/components/landing/timeline.data';

// Public-site footer (PublicLayout only). The colophon of the Record: nameplate between Sage
// double rules, the chapters in reading order, then appendices and the member portal.
// Text is Mist at ≥80% on Deep Forest (≥ 9:1); the old 30–40% white failed AA.

const APPENDIX_LINKS = [
  { to: '/bylaws', label: 'Constitution & By-Laws' },
  { to: '/contact', label: 'Contact' },
];

const PORTAL_LINKS = [
  { to: '/apply', label: 'Apply for membership' },
  { to: '/login', label: 'Member & officer login' },
];

const LINK_CLS = 'text-[0.9375rem] text-mist/85 hover:text-mist underline-offset-4 hover:underline decoration-sage transition-colors';
const HEADING_CLS = 'text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-sage mb-4';

function DoubleRule() {
  return (
    <div aria-hidden="true" className="flex-1 h-[5px] border-t-2 border-b border-sage/35" />
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-forest text-mist overflow-hidden bg-[radial-gradient(70%_60%_at_8%_0%,rgba(46,91,65,0.6),transparent_60%),radial-gradient(60%_50%_at_100%_100%,rgba(46,91,65,0.4),transparent_60%)]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-16 pb-10">
        {/* Nameplate */}
        <div className="flex items-center gap-5">
          <DoubleRule />
          <p className="font-display font-semibold uppercase tracking-[0.28em] text-[0.875rem] sm:text-[1rem] text-mist whitespace-nowrap">
            The USWAG Record
          </p>
          <DoubleRule />
        </div>
        <p className="text-center text-[0.8125rem] text-mist/80 mt-3 tracking-[0.06em]">
          United Students Working for Advocacy and Growth · Est. {FOUNDED_YEAR}
        </p>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] mt-14">
          {/* Brand */}
          <div>
            <Logo variant="onDark" size={36} />
            <address className="not-italic text-[0.9375rem] leading-relaxed text-mist/85 mt-5 max-w-[30ch]">
              Northwest Samar State University — Main Campus, Calbayog City, Samar 6710.
            </address>
          </div>

          {/* Chapters in reading order */}
          <nav aria-label="The Record">
            <p className={HEADING_CLS}>The Record</p>
            <ol className="space-y-2.5">
              {CHAPTERS.filter((c) => c.numeral).map((c) => (
                <li key={c.path} className="flex items-baseline gap-3">
                  <span className="font-display text-[0.8125rem] text-sage w-6 shrink-0" aria-hidden="true">{c.numeral}</span>
                  <Link to={c.path} className={LINK_CLS}>{c.title}</Link>
                </li>
              ))}
            </ol>
          </nav>

          {/* Appendices */}
          <nav aria-label="Appendices">
            <p className={HEADING_CLS}>Appendices</p>
            <ul className="space-y-2.5">
              {APPENDIX_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className={LINK_CLS}>{label}</Link>
                </li>
              ))}
              <li>
                <a
                  href="https://www.facebook.com/share/1FkuYoYfnN/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${LINK_CLS} inline-flex items-center gap-2`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.56 1.52-3.98 3.86-3.98 1.12 0 2.3.2 2.3.2v2.5h-1.3c-1.28 0-1.68.79-1.68 1.6V12h2.86l-.46 2.89h-2.4v6.98A10 10 0 0 0 22 12Z" />
                  </svg>
                  Facebook Page
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </nav>

          {/* Portal */}
          <nav aria-label="Members">
            <p className={HEADING_CLS}>Members</p>
            <ul className="space-y-2.5">
              {PORTAL_LINKS.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className={LINK_CLS}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 pt-6 border-t border-sage/25 flex flex-col-reverse md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-[0.8125rem] text-mist/80">© {year} USWAG · Northwest Samar State University</p>
          <div className="flex items-center gap-6">
            <Link to="/bylaws" className="text-[0.8125rem] text-mist/80 hover:text-mist hover:underline underline-offset-4 decoration-sage">
              Governed by the USWAG Constitution &amp; By-Laws
            </Link>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
              className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-sage hover:text-mist transition-colors whitespace-nowrap py-2"
            >
              Back to top <span aria-hidden="true">↑</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
