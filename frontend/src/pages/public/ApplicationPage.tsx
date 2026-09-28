// Membership Application — Article III: any bona fide NwSSU undergraduate
// may apply. This is a dedicated route (not a redirect to /login) because,
// until now, there was no way to get an account at all — /login required
// credentials that nothing on the site ever created. Submitting here
// creates the account in PENDING status; the applicant can then log in to
// check their status, and the application lands in the Secretary/Super
// Admin's existing "Pending Applications" queue (SuperAdminDashboardPage /
// MemberManagementPage) automatically, since it's the same MemberProfile
// table those already read from.
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { submitApplication } from '@/services/memberService';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

const COLLEGES = ['CEA', 'CCIS', 'CCJS', 'COM', 'CAT', 'CON', 'COED'];

export default function ApplicationPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [collegeOrDept, setCollegeOrDept] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  // Honeypot — real applicants never see or fill this (visually hidden +
  // aria-hidden + unreachable by Tab). A script that blindly fills every
  // input on the form fills it too; the backend silently no-ops for any
  // submission where this is non-empty (member.controller.ts).
  const [website, setWebsite] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setError('Please confirm you meet the eligibility requirements.');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitApplication({ name: name.trim(), email: email.trim(), password, collegeOrDept: collegeOrDept.trim(), yearLevel: yearLevel || undefined, website });
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to submit application. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden text-center">
          <div className="bg-forest px-8 py-8 text-white">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sage/30 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-sage" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Application Submitted</h1>
          </div>
          <div className="px-8 py-8">
            <p className="text-[14.5px] text-gray-600 leading-relaxed mb-6">
              Your membership application is now <span className="font-semibold text-primary">pending review</span> by the Secretary.
              You can log in anytime to check your status — you'll gain full member access (QR card, events, attendance) once approved.
            </p>
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-white font-display hover:bg-primary-light transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
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
          <h1 className="font-display text-2xl font-bold tracking-tight">Membership Application</h1>
          <p className="text-sage/80 text-sm mt-1">Join USWAG — Article III eligibility applies</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Honeypot — invisible and unreachable to real users (off-screen,
              aria-hidden, no tab stop, autoComplete off so browsers don't
              offer to fill it either); a naive script that fills every
              field on the form fills this one too. */}
          <div className="absolute -left-[9999px] top-0 opacity-0" aria-hidden="true">
            <label htmlFor="apply-website">Website</label>
            <input
              id="apply-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="apply-name" className="block text-sm font-medium text-forest">Full Name</label>
            <input
              id="apply-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan Dela Cruz"
              className="w-full rounded-lg border border-gray-200 bg-mist px-4 py-2.5 text-sm text-forest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="apply-email" className="block text-sm font-medium text-forest">Email address</label>
            <input
              id="apply-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@nwssu.edu.ph"
              className="w-full rounded-lg border border-gray-200 bg-mist px-4 py-2.5 text-sm text-forest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="apply-college" className="block text-sm font-medium text-forest">College/Dept.</label>
              <select
                id="apply-college"
                required
                value={collegeOrDept}
                onChange={(e) => setCollegeOrDept(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-mist px-4 py-2.5 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              >
                <option value="">Select…</option>
                {COLLEGES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="apply-year" className="block text-sm font-medium text-forest">Year Level</label>
              <select
                id="apply-year"
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-mist px-4 py-2.5 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
              >
                <option value="">Select…</option>
                {YEAR_LEVELS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="apply-password" className="block text-sm font-medium text-forest">Password</label>
            <input
              id="apply-password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-gray-200 bg-mist px-4 py-2.5 text-sm text-forest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="apply-confirm-password" className="block text-sm font-medium text-forest">Confirm Password</label>
            <input
              id="apply-confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              className="w-full rounded-lg border border-gray-200 bg-mist px-4 py-2.5 text-sm text-forest placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          <label className="flex items-start gap-2.5 text-[12.5px] text-gray-500 leading-relaxed">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span>
              I am a currently enrolled NwSSU undergraduate student, I support USWAG's three core advocacies, and I can commit to at least two (2) assemblies or events per semester, per Article III of the Constitution.
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-primary py-2.5 px-4 text-sm font-semibold text-white font-display hover:bg-primary-light active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Application'}
          </button>

          <p className="text-center text-xs text-gray-400">
            Already applied?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Log in to check your status
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
