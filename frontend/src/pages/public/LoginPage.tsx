// Shared login for Member, Officer Admin, and Super Admin — role read from the JWT.
// On success, redirects:
//   super_admin | officer_admin → /admin
//   member                      → /dashboard
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AuthShell from '@/components/landing/AuthShell';
import DigitalCardFace from '@/components/landing/artifacts/DigitalCardFace';
import { apiError } from '@/utils/apiError';

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
      if (session.user.mustChangePassword) {
        navigate('/account/password', { replace: true });
      } else if (session.user.isDeveloper) {
        navigate('/dev', { replace: true });
      } else if (role === 'super_admin' || role === 'officer_admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      // Axios wraps HTTP errors; pull the backend message when available
      const msg = apiError(err, 'Login failed. Please try again.');
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      headingId="login-heading"
      title="Welcome back."
      lead="Sign in to your member or officer account."
      footer={
        <p className="lp-small lp-ink-muted" style={{ fontWeight: 400 }}>
          Not a member yet?{' '}
          <Link to="/apply" className="lp-link py-0">Apply for membership</Link>
        </p>
      }
      canvas={{
        label: 'What members can do',
        eyebrow: 'Your record, in one place',
        title: (
          <>
            Your card. Your attendance. <em className="text-sage">Your voice.</em>
          </>
        ),
        art: (
          <div className="lp-card-stage max-w-[360px] w-full mx-auto lp-login-card" aria-hidden="true">
            <DigitalCardFace />
          </div>
        ),
        items: MEMBER_PERKS,
      }}
    >
      <form onSubmit={handleSubmit} className="lp-card p-6 sm:p-8 space-y-5">
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
    </AuthShell>
  );
}
