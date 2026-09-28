// Password reset — request step. Always shows the same generic success
// message regardless of whether the email exists (the backend does the
// same), so this page can't be used to probe which emails are registered.
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '@/services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ message: string; devResetUrl?: string } | null>(null);

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
    <div className="min-h-screen bg-mist flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-forest px-8 py-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sage/30 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Reset your password</h1>
          <p className="text-sage/80 text-sm mt-1">We'll send a reset link to your email</p>
        </div>

        {result ? (
          <div className="px-8 py-8">
            <div className="flex items-start gap-3 rounded-lg bg-successBg border border-success/20 px-4 py-3 text-success text-sm mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{result.message}</span>
            </div>

            {result.devResetUrl && (
              <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-700 mb-6 break-all">
                <p className="font-bold uppercase tracking-wide mb-1">Dev-only preview</p>
                <p className="mb-2">No email provider is configured yet, so this link is shown here instead of being emailed. It will never appear here in production.</p>
                <a href={result.devResetUrl} className="text-primary underline font-medium">{result.devResetUrl}</a>
              </div>
            )}

            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-white font-display hover:bg-primary-light transition-colors"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            {error && (
              <div role="alert" className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className="block text-sm font-medium text-forest">Email address</label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@nwssu.edu.ph"
                className="w-full rounded-lg border border-gray-200 bg-mist px-4 py-2.5 text-sm text-forest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-white font-display hover:bg-primary-light active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
            >
              {isSubmitting ? 'Sending…' : 'Send Reset Link'}
            </button>

            <p className="text-center text-xs text-gray-400">
              <Link to="/login" className="text-primary hover:underline font-medium">
                Back to Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
