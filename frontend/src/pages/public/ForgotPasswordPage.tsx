// Password reset — request step. Always shows the same generic success
// message regardless of whether the email exists (the backend does the
// same), so this page can't be used to probe which emails are registered.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '@/services/authService';
import AuthShell from '@/components/landing/AuthShell';
import EngravedKey from '@/components/landing/artifacts/EngravedKey';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ message: string; devResetUrl?: string } | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);
  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await forgotPassword(email.trim());
      setResult(res);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      headingId="forgot-heading"
      title="Reset your password."
      lead="Enter the email on your account and we’ll send you a link to set a new password."
      footer={
        <p className="lp-small lp-ink-muted" style={{ fontWeight: 400 }}>
          Remembered it?{' '}
          <Link to="/login" className="lp-link py-0">Back to login</Link>
        </p>
      }
      canvas={{
        label: 'About password resets',
        eyebrow: 'Keys to the record',
        title: (
          <>
            A new key, <em className="text-sage">safely cut.</em>
          </>
        ),
        art: <EngravedKey className="w-full max-w-[380px] mx-auto text-sage/80" />,
        items: [
          { title: 'Same answer for every email', desc: 'We never reveal whether an address has an account.' },
          { title: 'Single-use link', desc: 'Each reset link works once and expires.' },
          { title: 'Everywhere at once', desc: 'Setting a new password signs out your other sessions.' },
        ],
      }}
    >
      {result ? (
        <div ref={resultRef} tabIndex={-1} className="lp-card p-6 sm:p-8 space-y-5 focus:outline-none">
          <p role="status" className="lp-notice lp-notice--success">{result.message}</p>

          {result.devResetUrl && (
            <div className="lp-notice lp-notice--warn break-all">
              <p className="lp-eyebrow">Dev-only preview</p>
              <p className="mt-2">
                No email provider is configured yet, so this link is shown here instead of being emailed. It will never appear
                here in production.
              </p>
              <a href={result.devResetUrl} className="lp-link py-0 mt-2">{result.devResetUrl}</a>
            </div>
          )}

          <Link to="/login" className="lp-btn lp-btn--primary w-full">
            Back to login <span className="lp-btn__arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="lp-card p-6 sm:p-8 space-y-5">
          {error && (
            <p role="alert" className="lp-alert">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="forgot-email" className="lp-label">Email address</label>
            <input
              ref={emailRef}
              id="forgot-email"
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
          <button type="submit" disabled={isSubmitting} className="lp-btn lp-btn--primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
            {isSubmitting ? 'Sending…' : 'Send reset link'}
            {!isSubmitting && <span className="lp-btn__arrow" aria-hidden="true">→</span>}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
