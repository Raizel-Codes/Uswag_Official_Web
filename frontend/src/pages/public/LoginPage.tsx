// Shared login for Member, Officer Admin, and Super Admin — role read from the JWT.
// On success, redirects:
//   super_admin | officer_admin → /admin
//   member                      → /dashboard
import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Login failed. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center px-4 py-16">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* Header band */}
        <div className="bg-forest px-8 py-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sage/30 mb-4">
            {/* Lock icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-sage" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sage/80 text-sm mt-1">Sign in to your USWAG account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">

          {/* Error banner */}
          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-sm font-medium text-forest">
              Email address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@nwssu.edu.ph"
              className="
                w-full rounded-lg border border-gray-200 bg-mist px-4 py-2.5
                text-sm text-forest placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                transition
              "
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-sm font-medium text-forest">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="
                  w-full rounded-lg border border-gray-200 bg-mist px-4 py-2.5 pr-11
                  text-sm text-forest placeholder-gray-400
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                  transition
                "
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-primary transition"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.676 12.553a11.249 11.249 0 01-2.631 4.31l-3.099-3.099a5.25 5.25 0 00-6.71-6.71L7.759 4.577A11.217 11.217 0 0112 3.75c4.5 0 8.336 2.57 10.676 6.553a1.126 1.126 0 010 2.247-.003 0zM15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0115.75 12zM21.25 5.5L5.5 21.25" />
                    <path d="M8.25 12c0-.18.013-.357.037-.53l4.244 4.243A3.75 3.75 0 018.25 12z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                    <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            <div className="text-right">
              <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={isSubmitting}
            className="
              w-full rounded-lg bg-primary py-2.5 px-4
              text-sm font-semibold text-white font-display
              hover:bg-primary-light active:scale-[0.98]
              focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-150
            "
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </button>

          {/* Back to public site */}
          <p className="text-center text-xs text-gray-400">
            Not a member yet?{' '}
            <Link to="/join" className="text-primary hover:underline font-medium">
              Join USWAG
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
