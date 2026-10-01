// Password reset — request step. Two routes back in, depending on how the server is set up:
// - by email: an emailed link (once the organization has mail configured), or
// - through an officer: the person gives their email and student ID, an officer confirms who they
//   are by other means and hands them a private one-time link (the way a friend-assisted applicant
//   gets theirs). Also offered as "Can't get into your email?" when email is on.
// Both always show the same generic message regardless of whether the email exists (the backend does
// the same), so this page can't be used to probe which emails are registered.
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword, getResetOptions, requestResetHelp } from '@/services/authService';
import AuthShell from '@/components/landing/AuthShell';
import EngravedKey from '@/components/landing/artifacts/EngravedKey';
import { apiError } from '@/utils/apiError';
import { formatStudentId, studentIdProblem } from '@/utils/studentId';

type Route = 'email' | 'officer';

export default function ForgotPasswordPage() {
  const [serverRoute, setServerRoute] = useState<Route | null>(null); // what the server offers; null while asking
  const [route, setRoute] = useState<Route>('email'); // what the person is using
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ message: string; devResetUrl?: string; route: Route } | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getResetOptions()
      .then((o) => {
        setServerRoute(o.method);
        setRoute(o.method);
      })
      .catch(() => setServerRoute('email')); // can't tell: offer the usual email form
  }, []);
  useEffect(() => {
    if (serverRoute) emailRef.current?.focus();
  }, [serverRoute]);
  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (route === 'officer') {
      const problem = studentIdProblem(studentId);
      if (problem) {
        setError(problem);
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const res = route === 'officer' ? await requestResetHelp(email.trim(), studentId) : await forgotPassword(email.trim());
      setResult({ ...res, route });
    } catch (err) {
      setError(apiError(err, 'Something went wrong. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchRoute(next: Route) {
    setError(null);
    setRoute(next);
  }

  const officerRoute = route === 'officer';

  return (
    <AuthShell
      headingId="forgot-heading"
      title="Reset your password."
      lead={
        officerRoute
          ? 'Tell us the email and student ID on your account. An officer will confirm it’s you and give you a private link to set a new password.'
          : 'Enter the email on your account and we’ll send you a link to set a new password.'
      }
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

          {result.route === 'officer' ? (
            <div className="space-y-2">
              <p className="lp-eyebrow">What happens next</p>
              <ol className="lp-small lp-ink-muted list-decimal pl-5 space-y-1.5">
                <li>An officer checks it’s really you. They may find you in person or message you, so keep an eye out.</li>
                <li>They give you a private link. It works once and expires an hour after they create it.</li>
                <li>Open it and choose a new password. Don’t share the link with anyone else.</li>
              </ol>
              <p className="lp-small lp-ink-muted">Nothing arrives by email, so there’s no need to check your inbox.</p>
            </div>
          ) : (
            !result.devResetUrl && (
              <p className="lp-small lp-ink-muted">
                It can take a few minutes to arrive, so check your spam folder too. The link works once and expires in an hour.
              </p>
            )
          )}

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
      ) : serverRoute === null ? (
        <div className="lp-card p-6 sm:p-8" aria-busy="true">
          <p className="lp-small lp-ink-muted">One moment…</p>
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
          {officerRoute && (
            <div>
              <label htmlFor="forgot-student-id" className="lp-label">Student ID number</label>
              <input
                id="forgot-student-id"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                required
                maxLength={9}
                placeholder="23-00877"
                value={studentId}
                onChange={(e) => setStudentId(formatStudentId(e.target.value))}
                aria-describedby="forgot-student-id-hint"
                className="lp-input"
              />
              <p id="forgot-student-id-hint" className="lp-hint">
                The one you gave when you applied. It helps the officer confirm it’s you; it isn’t stored or shown to them.
              </p>
            </div>
          )}
          <button type="submit" disabled={isSubmitting} className="lp-btn lp-btn--primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
            {isSubmitting ? 'Sending…' : officerRoute ? 'Ask an officer for a link' : 'Send reset link'}
            {!isSubmitting && <span className="lp-btn__arrow" aria-hidden="true">→</span>}
          </button>
          {serverRoute === 'email' && (
            <p className="lp-small lp-ink-muted text-center" style={{ fontWeight: 400 }}>
              {officerRoute ? (
                <button type="button" onClick={() => switchRoute('email')} className="lp-link py-0">Email me a link instead</button>
              ) : (
                <>
                  Can’t get into your email?{' '}
                  <button type="button" onClick={() => switchRoute('officer')} className="lp-link py-0">Ask an officer instead</button>
                </>
              )}
            </p>
          )}
        </form>
      )}
    </AuthShell>
  );
}
