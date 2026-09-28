// Password reset — confirm step. Reached via the link from
// ForgotPasswordPage.tsx (?token=...). The backend re-validates the token's
// hash + expiry independently — this page never trusts the token itself,
// it just passes it through.
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '@/services/authService';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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
    <div className="min-h-screen bg-mist flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-forest px-8 py-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sage/30 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-sage" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Set a new password</h1>
        </div>

        {done ? (
          <div className="px-8 py-8 text-center">
            <p className="text-[14.5px] text-gray-600 leading-relaxed mb-6">
              Your password has been updated. Any other active sessions have been signed out for security — please log in with your new password.
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-white font-display hover:bg-primary-light transition-colors"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            {!token && (
              <div role="alert" className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-700 text-sm">
                <span>This link is missing its reset token. Please request a new one from the <Link to="/forgot-password" className="underline font-medium">forgot password</Link> page.</span>
              </div>
            )}

            {error && (
              <div role="alert" className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="reset-password" className="block text-sm font-medium text-forest">New Password</label>
              <input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-gray-200 bg-mist px-4 py-2.5 text-sm text-forest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-forest">Confirm New Password</label>
              <input
                id="reset-confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="w-full rounded-lg border border-gray-200 bg-mist px-4 py-2.5 text-sm text-forest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !token}
              className="w-full rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-white font-display hover:bg-primary-light active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
            >
              {isSubmitting ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
