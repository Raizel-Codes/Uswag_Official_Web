// Password reset — confirm step. Reached via the link from
// ForgotPasswordPage.tsx (?token=...). The backend re-validates the token's
// hash + expiry independently — this page never trusts the token itself,
// it just passes it through.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '@/services/authService';
import AuthShell from '@/components/landing/AuthShell';
import EngravedKey from '@/components/landing/artifacts/EngravedKey';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) firstRef.current?.focus();
  }, [token]);
  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('This reset link is missing its token. Please request a new one.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to reset password. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      headingId="reset-heading"
      title="Set a new password."
      lead="Choose a strong password — at least 8 characters."
      footer={
        <p className="lp-small lp-ink-muted" style={{ fontWeight: 400 }}>
          Link expired?{' '}
          <Link to="/forgot-password" className="lp-link py-0">Request a new one</Link>
        </p>
      }
      canvas={{
        label: 'About password resets',
        eyebrow: 'Keys to the record',
        title: (
          <>
            One new key. <em className="text-sage">Every old lock changed.</em>
          </>
        ),
        art: <EngravedKey className="w-full max-w-[380px] mx-auto text-sage/80" />,
        items: [
          { title: 'Checked on our side', desc: 'The link is verified by the server, never trusted by this page.' },
          { title: 'Other sessions signed out', desc: 'Anyone still signed in with the old password is logged out.' },
        ],
      }}
    >
      {done ? (
        <div ref={doneRef} tabIndex={-1} className="lp-card p-6 sm:p-8 space-y-5 focus:outline-none">
          <p role="status" className="lp-notice lp-notice--success">
            Your password has been updated. Any other active sessions have been signed out for security — please log in with
            your new password.
          </p>
          <button type="button" onClick={() => navigate('/login', { replace: true })} className="lp-btn lp-btn--primary w-full">
            Go to login <span className="lp-btn__arrow" aria-hidden="true">→</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="lp-card p-6 sm:p-8 space-y-5">
          {!token && (
            <p role="alert" className="lp-notice lp-notice--warn">
              This link is missing its reset token. Please request a new one from the{' '}
              <Link to="/forgot-password" className="lp-link py-0">forgot password</Link> page.
            </p>
          )}
          {error && (
            <p role="alert" className="lp-alert">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="reset-password" className="lp-label">New password</label>
            <input
              ref={firstRef}
              id="reset-password"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              aria-describedby="reset-password-hint"
              className="lp-input"
            />
            <p id="reset-password-hint" className="lp-hint">At least 8 characters.</p>
          </div>
          <div>
            <label htmlFor="reset-confirm-password" className="lp-label">Confirm new password</label>
            <input
              id="reset-confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="lp-input"
            />
          </div>
          <button type="submit" disabled={isSubmitting || !token} className="lp-btn lp-btn--primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
            {isSubmitting ? 'Updating…' : 'Update password'}
            {!isSubmitting && <span className="lp-btn__arrow" aria-hidden="true">→</span>}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
