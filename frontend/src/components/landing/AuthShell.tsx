import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import PublicPage from './PublicPage';
import EngravedCrest from './artifacts/EngravedCrest';
import EngravedRule from './ornaments/EngravedRule';

interface AuthShellProps {
  headingId: string;
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  /** The form (or result) — rendered first in source order: it's what the visitor came for. */
  children: ReactNode;
  /** Links under the form. */
  footer?: ReactNode;
  canvas: {
    label: string;
    eyebrow: string;
    title: ReactNode;
    art?: ReactNode;
    items?: { title: string; desc: string }[];
  };
}

/**
 * Shared layout for the account pages (Login, Forgot password, Reset password): a quick,
 * uncluttered form column on Mist, and a Deep Forest "vault" canvas beside it that carries
 * the Record's craft without getting in the way. On phones the canvas follows the form.
 */
export default function AuthShell({ headingId, eyebrow = 'The USWAG Record · Members & officers', title, lead, children, footer, canvas }: AuthShellProps) {
  return (
    <PublicPage surface="present" hideChapterNav>
      <section aria-labelledby={headingId} className="lp-section pt-10 md:pt-14">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 grid lg:grid-cols-2 gap-10 lg:gap-14 items-stretch">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <EngravedCrest size={40} />
              <p className="lp-eyebrow lp-ink-muted">{eyebrow}</p>
            </div>
            <h1 id={headingId} className="lp-h2 mt-6" style={{ fontSize: 'clamp(2.25rem, 4vw, 3.25rem)' }}>
              {title}
            </h1>
            {lead && <p className="lp-body lp-ink-muted mt-3">{lead}</p>}
            <div className="mt-8">{children}</div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              {footer}
              <Link to="/" className="lp-link py-0 text-[0.875rem]">
                <span aria-hidden="true">←</span> Front page
              </Link>
            </div>
          </div>

          <aside aria-label={canvas.label} className="lp-vault lp-vault--framed lp-vault--panel lp-on-dark p-8 sm:p-12 lp-login-canvas">
            <div>
              <p className="lp-eyebrow text-sage">{canvas.eyebrow}</p>
              <p className="font-display text-mist mt-4 leading-[1.1]" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
                {canvas.title}
              </p>
              <EngravedRule className="mt-6 max-w-[200px] text-sage" reveal={false} />
            </div>
            {canvas.art && <div className="my-10 w-full">{canvas.art}</div>}
            {canvas.items && (
              <ul className="space-y-4">
                {canvas.items.map((p) => (
                  <li key={p.title} className="flex gap-3.5">
                    <span className="mt-1.5 w-2 h-2 rotate-45 bg-sage shrink-0" aria-hidden="true" />
                    <p className="text-[0.9375rem] leading-[1.55] text-mist/90">
                      <span className="font-semibold text-mist">{p.title}.</span> {p.desc}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </section>
    </PublicPage>
  );
}
