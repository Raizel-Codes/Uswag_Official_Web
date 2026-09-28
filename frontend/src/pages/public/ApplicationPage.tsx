// Membership Application — Article III: any bona fide NwSSU student may apply.
// This is a dedicated route (not a redirect to /login) because, until now, there was no way
// to get an account at all — /login required credentials that nothing on the site ever
// created. Submitting here creates the account in PENDING status; the applicant can then log
// in to check their status, and the application lands in the Secretary/Super Admin's existing
// "Pending Applications" queue (SuperAdminDashboardPage / MemberManagementPage) automatically,
// since it's the same MemberProfile table those already read from.
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { submitApplication } from '@/services/memberService';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import PublicPage from '@/components/landing/PublicPage';
import PageMasthead from '@/components/landing/PageMasthead';
import SectionHeading from '@/components/landing/SectionHeading';
import MembershipEnvelope, { useFocusAfterOpen } from '@/components/landing/artifacts/MembershipEnvelope';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

const COLLEGES = ['CEA', 'CCIS', 'CCJS', 'COM', 'CAT', 'CON', 'COED'];

const NEXT_STEPS = [
  { n: '1', title: 'Submit this form', desc: 'Your account is created with a pending status.' },
  { n: '2', title: 'Secretary review', desc: 'Your application joins the Secretary’s review queue.' },
  { n: '3', title: 'Fee & orientation', desc: 'Pay the membership fee and attend an onboarding session.' },
  { n: '4', title: 'Your digital card', desc: 'Once approved, your signed QR membership card is issued.' },
];

function Fieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-5">
      <legend className="lp-eyebrow text-primary mb-5 flex items-center gap-3 w-full">
        {legend}
        <span className="h-px flex-1 bg-[rgb(20_39_24/0.15)]" aria-hidden="true" />
      </legend>
      {children}
    </fieldset>
  );
}

export default function ApplicationPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [collegeOrDept, setCollegeOrDept] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [termsOpened, setTermsOpened] = useState(false);
  // Honeypot — real applicants never see or fill this (visually hidden +
  // aria-hidden + unreachable by Tab). A script that blindly fills every
  // input on the form fills it too; the backend silently no-ops for any
  // submission where this is non-empty (member.controller.ts).
  const [website, setWebsite] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const sealRef = useRef<HTMLButtonElement>(null);
  const agreeRef = useRef<HTMLInputElement>(null);
  const [termsHeading, setTermsHeading] = useState<HTMLHeadingElement | null>(null);
  useLandingReveal(sectionRef, [submitted]);
  useFocusAfterOpen(termsOpened, termsHeading);

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
    if (!termsOpened) {
      setError('Please break the seal and read the membership terms before you submit.');
      sealRef.current?.focus();
      return;
    }
    if (!agreed) {
      setError('Please confirm you have read the membership terms and meet the requirements.');
      agreeRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await submitApplication({ name: name.trim(), email: email.trim(), password, collegeOrDept: collegeOrDept.trim(), yearLevel: yearLevel || undefined, website });
      setSubmitted(true);
      window.scrollTo({ top: 0 });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to submit application. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <PublicPage hideChapterNav>
        <section ref={sectionRef} aria-labelledby="apply-done" data-era="past" className="lp-section lp-grain -mt-[68px] md:-mt-[76px] pt-[calc(68px+3rem)] md:pt-[calc(76px+4rem)]">
          <div className="max-w-[720px] mx-auto px-4 sm:px-8 text-center">
            <div data-lp-reveal>
              <MembershipEnvelope received />
            </div>
            <p className="lp-eyebrow lp-ink-caption mt-14" data-lp-reveal>Application received</p>
            <h1 id="apply-done" className="lp-h2 mt-4" data-lp-reveal>
              Your name is in the envelope.
            </h1>
            <p className="lp-body lp-ink-secondary mt-6 mx-auto" data-lp-reveal>
              Your membership application is now <strong className="font-semibold text-primary">pending review</strong> by the
              Secretary. You can log in any time to check your status — you’ll gain full member access (QR card, events,
              attendance) once approved.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-9" data-lp-reveal>
              <Link to="/login" className="lp-btn lp-btn--primary">
                Go to login <span className="lp-btn__arrow" aria-hidden="true">→</span>
              </Link>
              <Link to="/" className="lp-btn lp-btn--ghost">
                Back to the front page
              </Link>
            </div>
          </div>
        </section>
      </PublicPage>
    );
  }

  return (
    <PublicPage hideChapterNav>
      <PageMasthead
        eyebrow="Membership application"
        title={
          <>
            Apply to <em className="text-primary">join the record.</em>
          </>
        }
        lead="It takes about two minutes. Before you submit, you’ll open the membership terms and confirm you understand them."
      >
        <p className="lp-small lp-ink-secondary">
          Already applied?{' '}
          <Link to="/login" className="lp-link py-0">
            Log in to check your status
          </Link>
        </p>
      </PageMasthead>

      <section ref={sectionRef} aria-label="Application form" data-era="present" className="lp-section pt-6" data-lp-era-start data-lp-era-end>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-12 lg:gap-14 items-start">
          <form onSubmit={handleSubmit} className="lp-card p-6 sm:p-10 lg:col-span-7 space-y-12" data-lp-reveal>
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

            <Fieldset legend="Your details">
              <div>
                <label htmlFor="apply-name" className="lp-label">Full name</label>
                <input id="apply-name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Dela Cruz" className="lp-input" />
              </div>
              <div>
                <label htmlFor="apply-email" className="lp-label">Email address</label>
                <input id="apply-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@nwssu.edu.ph" className="lp-input" />
              </div>
            </Fieldset>

            <Fieldset legend="Your studies">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="apply-college" className="lp-label">College / Dept.</label>
                  <select id="apply-college" required value={collegeOrDept} onChange={(e) => setCollegeOrDept(e.target.value)} className="lp-input">
                    <option value="">Select…</option>
                    {COLLEGES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="apply-year" className="lp-label">
                    Year level <span className="normal-case tracking-normal font-medium lp-ink-muted">(optional)</span>
                  </label>
                  <select id="apply-year" value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} className="lp-input">
                    <option value="">Select…</option>
                    {YEAR_LEVELS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Fieldset>

            <Fieldset legend="Your account">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="apply-password" className="lp-label">Password</label>
                  <input id="apply-password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="apply-password-hint" className="lp-input" />
                  <p id="apply-password-hint" className="lp-hint">At least 8 characters.</p>
                </div>
                <div>
                  <label htmlFor="apply-confirm-password" className="lp-label">Confirm password</label>
                  <input id="apply-confirm-password" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="lp-input" />
                </div>
              </div>
            </Fieldset>

            <Fieldset legend="The membership terms">
              <MembershipEnvelope ref={sealRef} opened={termsOpened} onOpen={() => setTermsOpened(true)} controlsId="apply-terms" />

              {!termsOpened ? (
                <p className="lp-small lp-ink-muted text-center" style={{ fontWeight: 400 }}>
                  Break the seal to read the terms. You’ll need to understand them — and confirm — before you can submit.
                </p>
              ) : (
                <div id="apply-terms" className="lp-terms">
                  <div>
                    <div className="lp-card lp-card--past p-6 sm:p-8">
                      <p className="lp-eyebrow lp-ink-caption">Article III · Membership</p>
                      <h3 ref={setTermsHeading} tabIndex={-1} className="lp-h3 mt-3 focus:outline-none" style={{ fontSize: '1.5rem' }}>
                        You need to understand this first.
                      </h3>
                      <p className="lp-body lp-ink-secondary mt-3" style={{ fontSize: '1rem' }}>
                        Read these terms from the USWAG Constitution before you submit an application.
                      </p>
                      <ol className="mt-6 space-y-4">
                        {[
                          <>Membership is open to all <strong className="font-semibold">bona fide students of Northwest Samar State University</strong> who support the vision and mission of USWAG.</>,
                          <>To become a member you will <strong className="font-semibold">submit this completed form</strong>, <strong className="font-semibold">pay the membership fee</strong> (as determined by the officers and approved by the adviser; currently ₱50.00), and <strong className="font-semibold">attend an orientation</strong> or onboarding session.</>,
                          <>Membership is <strong className="font-semibold">valid for one academic year</strong> and is renewable annually.</>,
                          <>As a member you’re expected to take an active part in USWAG’s initiatives and to follow the Constitution and the policies of its elected officers (Article V).</>,
                        ].map((t, i) => (
                          <li key={i} className="flex gap-4 text-[0.9375rem] leading-[1.65]">
                            <span className="lp-seal w-8 h-8 text-[0.8125rem] font-display lp-lnum" aria-hidden="true">{i + 1}</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ol>

                      <label htmlFor="apply-agree" className="mt-8 pt-6 border-t border-dotted border-[rgb(122_98_66/0.45)] flex items-start gap-3.5 cursor-pointer">
                        <input
                          ref={agreeRef}
                          id="apply-agree"
                          type="checkbox"
                          className="lp-check"
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                        />
                        <span className="text-[0.9375rem] leading-[1.6] font-medium">
                          I have read and understood these terms. I am a bona fide NwSSU student, I support USWAG’s three core
                          advocacies, and I agree to the membership requirements of Article III of the Constitution.
                        </span>
                      </label>

                      <p className="lp-dateline lp-ink-secondary mt-6 text-right" style={{ fontSize: '1rem' }}>
                        Signed, <span className="border-b border-dotted border-[var(--lp-sepia)] px-2">{name.trim() || '________________'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Fieldset>

            <div className="space-y-4">
              {error && (
                <p role="alert" className="lp-alert">
                  {error}
                </p>
              )}
              <button type="submit" disabled={isSubmitting} className="lp-btn lp-btn--primary w-full disabled:opacity-60 disabled:cursor-not-allowed">
                {isSubmitting ? 'Submitting…' : 'Submit application'}
                {!isSubmitting && <span className="lp-btn__arrow" aria-hidden="true">→</span>}
              </button>
              <p className="lp-small lp-ink-muted text-center" style={{ fontWeight: 400 }}>
                Already applied?{' '}
                <Link to="/login" className="lp-link py-0">Log in to check your status</Link>
              </p>
            </div>
          </form>

          <aside className="lg:col-span-5 lg:sticky lg:top-28" aria-labelledby="apply-next">
            <SectionHeading id="apply-next" eyebrow="What happens next" title="From envelope to card" />
            <ol className="mt-10 space-y-6">
              {NEXT_STEPS.map((s) => (
                <li key={s.n} className="flex gap-4" data-lp-reveal>
                  <span className="lp-seal w-11 h-11 font-display text-[1.125rem] lp-lnum" aria-hidden="true">{s.n}</span>
                  <div>
                    <h3 className="font-display font-semibold text-[1.125rem]">{s.title}</h3>
                    <p className="lp-small lp-ink-muted mt-1" style={{ fontWeight: 400, fontSize: '0.9375rem' }}>{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>
    </PublicPage>
  );
}
