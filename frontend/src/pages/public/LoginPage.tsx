// Shared login for Member, Officer Admin, and Super Admin — role read from the JWT.
// On success, redirects:
//   super_admin | officer_admin → /admin
//   member                      → /dashboard
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import PublicPage from '@/components/landing/PublicPage';
import EngravedCrest from '@/components/landing/artifacts/EngravedCrest';
import DigitalCardFace from '@/components/landing/artifacts/DigitalCardFace';
import EngravedRule from '@/components/landing/ornaments/EngravedRule';

const MEMBER_PERKS = [
  { title: 'Your digital membership card', desc: 'A signed QR card, ready to scan at the door.' },
  { title: 'RSVPs & attendance', desc: 'Reserve limited slots and see your attendance record.' },
  { title: 'Announcements', desc: 'Notices from your officers, the moment they’re posted.' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // A sign-in page has one job — put the cursor where it's needed.
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const session = await login(email.trim(), password);
      const role = session.user.role;
      if (role === 'super_admin' || role === 'officer_admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      // Axios wraps HTTP errors; pull the backend message when available
      const msg = err?.response?.data?.message ?? err?.message ?? 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PublicPage surface="present" hideChapterNav>
      <section aria-labelledby="login-heading" className="lp-section pt-10 md:pt-14">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 grid lg:grid-cols-2 gap-10 lg:gap-14 items-stretch">
          {/* ---- Sign-in (first in source order: it's what the visitor came for) ---- */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <EngravedCrest size={40} />
              <p className="lp-eyebrow lp-ink-muted">The USWAG Record · Members &amp; officers</p>
            </div>
            <h1 id="login-heading" className="lp-h2 mt-6" style={{ fontSize: 'clamp(2.25rem, 4vw, 3.25rem)' }}>
              Welcome back.
            </h1>
            <p className="lp-body lp-ink-muted mt-3">Sign in to your member or officer account.</p>

            <form onSubmit={handleSubmit} className="lp-card p-6 sm:p-8 mt-8 space-y-5">
              {error && (
                <p role="alert" className="lp-alert">
                  {error}
                </p>
              )}

              <div>
                <label htmlFor="login-email" className="lp-label">Email address</label>
                <input
                  ref={emailRef}
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@nwssu.edu.ph"
                  className="lp-input"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor="login-password" className="lp-label">Password</label>
                  <Link to="/forgot-password" className="lp-link py-0 text-[0.8125rem] mb-2">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="lp-input pr-12"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-forest/70 hover:text-primary transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                        <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A10.4 10.4 0 0112 5c5 0 9 4.5 10 7-.4 1-1.3 2.4-2.6 3.7M6.6 6.6C4.6 8 3.3 10 2 12c1 2.5 5 7 10 7 1.8 0 3.4-.5 4.8-1.3" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button id="login-submit" type="submit" disabled={isSubmitting} className="lp-btn lp-btn--primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  <>
                    Sign in <span className="lp-btn__arrow" aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="lp-small lp-ink-muted" style={{ fontWeight: 400 }}>
                Not a member yet?{' '}
                <Link to="/apply" className="lp-link py-0">Apply for membership</Link>
              </p>
              <Link to="/" className="lp-link py-0 text-[0.875rem]">
                <span aria-hidden="true">←</span> Front page
              </Link>
            </div>
          </div>

          {/* ---- Canvas: what signing in opens up ---- */}
          <aside aria-label="What members can do" className="lp-vault lp-vault--framed lp-vault--panel lp-on-dark p-8 sm:p-12 lp-login-canvas">
            <div>
              <p className="lp-eyebrow text-sage">Your record, in one place</p>
              <p className="font-display text-mist mt-4 leading-[1.1]" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.5rem)' }}>
                Your card. Your attendance. <em className="text-sage">Your voice.</em>
              </p>
              <EngravedRule className="mt-6 max-w-[200px] text-sage" reveal={false} />
            </div>

            <div className="lp-card-stage my-10 max-w-[360px] w-full mx-auto lp-login-card" aria-hidden="true">
              <DigitalCardFace />
            </div>

            <ul className="space-y-4">
              {MEMBER_PERKS.map((p) => (
                <li key={p.title} className="flex gap-3.5">
                  <span className="mt-1.5 w-2 h-2 rotate-45 bg-sage shrink-0" aria-hidden="true" />
                  <p className="text-[0.9375rem] leading-[1.55] text-mist/90">
                    <span className="font-semibold text-mist">{p.title}.</span> {p.desc}
                  </p>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </PublicPage>
  );
}
