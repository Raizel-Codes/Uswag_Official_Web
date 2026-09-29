// Membership Application — Article III: any bona fide NwSSU student may apply.
// This is a dedicated route (not a redirect to /login) because, until now, there was no way
// to get an account at all — /login required credentials that nothing on the site ever
// created. Submitting here creates the account in PENDING status; the applicant can then log
// in to check their status, and the application lands in the Secretary/Super Admin's existing
// "Pending Applications" queue (SuperAdminDashboardPage / MemberManagementPage) automatically,
// since it's the same MemberProfile table those already read from.
//
// Submitting is a small ceremony (ApplicationDropbox): the envelope seals while the request is
// in flight, and only once the server has accepted it does the door open, take it in and bolt
// shut. What actually stops a second application is the server (one account per email, one per
// student ID); the shut door on a revisit is a courtesy, not a lock. The one exception built in
// is a friend who is present but has no device: "Applying for a friend" submits on their behalf
// without a password (the Secretary gives them a one-time setup link).
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { submitApplication } from '@/services/memberService';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import { prefersReducedMotion } from '@/lib/motion';
import PublicPage from '@/components/landing/PublicPage';
import PageMasthead from '@/components/landing/PageMasthead';
import SectionHeading from '@/components/landing/SectionHeading';
import MembershipEnvelope, { useFocusAfterOpen } from '@/components/landing/artifacts/MembershipEnvelope';
import ApplicationDropbox, { type DropboxPhase } from '@/components/landing/artifacts/ApplicationDropbox';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'];

const COLLEGES = ['CEA', 'CCIS', 'CCJS', 'COM', 'CAT', 'CON', 'COED'];

// NwSSU student ID: YY-NNNNN (or 6 digits) — enrollment year, then the student's
// number that year, e.g. 23-00877. Mirrors submitApplicationSchema.studentId.
const STUDENT_ID_PATTERN = /^\d{2}-\d{5,6}$/;

/** Digits only, hyphen inserted after the year: "2300877" → "23-00877". */
function formatStudentId(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  return digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits;
}

/** Minimum time the envelope spends sealing, so a fast response doesn't cut the ceremony. */
const SEALING_MS = 1700;

const NEXT_STEPS = [
  { n: '1', title: 'Submit this form', desc: 'Your account is created with a pending status.' },
  { n: '2', title: 'Secretary review', desc: 'Your application joins the Secretary’s review queue.' },
  { n: '3', title: 'Fee & orientation', desc: 'Pay the membership fee and attend an onboarding session.' },
  { n: '4', title: 'Your digital card', desc: 'Once approved, your signed QR membership card is issued.' },
];

const FRIEND_STEPS = [
  { n: '1', title: 'Submit on their behalf', desc: 'Their account is created with a pending status. No password yet.' },
  { n: '2', title: 'Verified in person', desc: 'The Secretary checks their application and student ID with them.' },
  { n: '3', title: 'Their own password', desc: 'The Secretary gives them a one-time link to set their own password.' },
  { n: '4', title: 'Their digital card', desc: 'Once approved, their signed QR membership card is issued.' },
];

/** What this device remembers after sending (a courtesy only — the server is the real guard). */
interface SentRecord {
  firstName: string;
  forFriend: boolean;
  at: string; // ISO
}
const SENT_KEY = 'uswag_application_sent';

function readSent(): SentRecord | null {
  try {
    const raw = localStorage.getItem(SENT_KEY);
    return raw ? (JSON.parse(raw) as SentRecord) : null;
  } catch {
    return null;
  }
}
function writeSent(record: SentRecord) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(record));
  } catch {
    /* private mode etc. — nothing to remember, the server still guards */
  }
}

function firstNameOf(name: string) {
  return name.trim().split(/\s+/)[0] ?? '';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

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

type Mode = 'self' | 'friend';
type Phase = 'form' | DropboxPhase;

export default function ApplicationPage() {
  const [mode, setMode] = useState<Mode>('self');
  const [sent, setSent] = useState<SentRecord | null>(readSent);
  // A device that already sent an application opens on the shut door.
  const [phase, setPhase] = useState<Phase>(() => (readSent() ? 'closed' : 'form'));
  const [restored, setRestored] = useState(() => readSent() !== null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [collegeOrDept, setCollegeOrDept] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [helperName, setHelperName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [attested, setAttested] = useState(false);
  const [termsOpened, setTermsOpened] = useState(false);
  // Honeypot — real applicants never see or fill this (visually hidden +
  // aria-hidden + unreachable by Tab). A script that blindly fills every
  // input on the form fills it too; the backend silently no-ops for any
  // submission where this is non-empty (member.controller.ts).
  const [website, setWebsite] = useState('');

  const [error, setError] = useState<string | null>(null);

  const sectionRef = useRef<HTMLElement>(null);
  const sealRef = useRef<HTMLButtonElement>(null);
  const agreeRef = useRef<HTMLInputElement>(null);
  const attestRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const doneHeadingRef = useRef<HTMLHeadingElement>(null);
  const [termsHeading, setTermsHeading] = useState<HTMLHeadingElement | null>(null);
  useLandingReveal(sectionRef, [phase === 'form', mode]);
  useFocusAfterOpen(termsOpened, termsHeading);

  const forFriend = mode === 'friend';
  const friendFirst = firstNameOf(name) || 'your friend';

  // A rejected submission lands back on the form: bring the message into view.
  useEffect(() => {
    if (phase === 'form' && error) errorRef.current?.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [phase, error]);

  // The door has shut: move focus to the result (not on a restored visit — nothing just happened).
  useEffect(() => {
    if (phase === 'closed' && !restored) doneHeadingRef.current?.focus();
  }, [phase, restored]);

  function resetFields() {
    setName('');
    setEmail('');
    setStudentId('');
    setCollegeOrDept('');
    setYearLevel('');
    setPassword('');
    setConfirmPassword('');
    setHelperName('');
    setAgreed(false);
    setAttested(false);
    setTermsOpened(false);
    setError(null);
  }

  function startFriendApplication() {
    resetFields();
    setMode('friend');
    setRestored(false);
    setPhase('form');
    window.scrollTo({ top: 0 });
  }

  function leaveFriendMode() {
    resetFields();
    setMode('self');
    if (sent) {
      setRestored(true);
      setPhase('closed');
    }
    window.scrollTo({ top: 0 });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!STUDENT_ID_PATTERN.test(studentId)) {
      setError('Enter the student ID like 23-00877: the two-digit enrollment year, a hyphen, then 5 or 6 digits.');
      return;
    }
    if (Number(studentId.slice(0, 2)) > new Date().getFullYear() % 100) {
      setError('That enrollment year hasn’t happened yet. Check the first two digits of the student ID.');
      return;
    }
    if (forFriend) {
      if (helperName.trim().length < 2) {
        setError('Tell us your name, the person helping, so the Secretary knows who submitted this.');
        return;
      }
    } else {
      if (password.length < 8) {
        setError('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }
    if (!termsOpened) {
      setError('Please break the seal and read the membership terms before you submit.');
      sealRef.current?.focus();
      return;
    }
    if (!agreed) {
      setError(
        forFriend
          ? `${friendFirst} needs to confirm they have read the membership terms and meet the requirements.`
          : 'Please confirm you have read the membership terms and meet the requirements.'
      );
      agreeRef.current?.focus();
      return;
    }
    if (forFriend && !attested) {
      setError(`Please confirm ${friendFirst} is here with you and asked you to submit this.`);
      attestRef.current?.focus();
      return;
    }

    setPhase('sealing');
    window.scrollTo({ top: 0 });
    try {
      await Promise.all([
        submitApplication({
          name: name.trim(),
          email: email.trim(),
          studentId,
          collegeOrDept: collegeOrDept.trim(),
          yearLevel: yearLevel || undefined,
          website,
          ...(forFriend ? { onBehalf: { helperName: helperName.trim(), attested: true as const } } : { password }),
        }),
        new Promise((r) => setTimeout(r, prefersReducedMotion() ? 0 : SEALING_MS)),
      ]);
      const record = { firstName: firstNameOf(name), forFriend, at: new Date().toISOString() };
      writeSent(record);
      setSent(record);
      setRestored(false);
      setPhase('posting');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to submit application. Please try again.';
      setError(msg);
      setPhase('form');
    }
  }

  // ---------------------------------------------------------------- Sealing, posting, shut door
  if (phase !== 'form') {
    const done = phase === 'closed' && sent;
    return (
      <PublicPage hideChapterNav>
        <section ref={sectionRef} aria-labelledby="apply-status" data-era="past" className="lp-section lp-grain -mt-[68px] md:-mt-[76px] pt-[calc(68px+3rem)] md:pt-[calc(76px+4rem)]">
          <div className="max-w-[720px] mx-auto px-4 sm:px-8 text-center">
            <p className="lp-eyebrow lp-ink-caption">{done ? 'Application received' : 'Membership application'}</p>
            <h1 id="apply-status" ref={doneHeadingRef} tabIndex={-1} className="lp-h2 mt-4 focus:outline-none">
              {done
                ? sent.forFriend
                  ? `${sent.firstName}’s application is through the door.`
                  : 'Your application is through the door.'
                : phase === 'sealing'
                  ? 'Sealing your application…'
                  : 'Sending it through…'}
            </h1>
            {/* Screen readers get the steps in words; the ceremony itself is aria-hidden */}
            <p role="status" className="lp-sr-only">
              {phase === 'sealing' ? 'Sealing and sending your application.' : phase === 'posting' ? 'Application received.' : ''}
            </p>

            <div className="mt-8">
              <ApplicationDropbox
                phase={phase}
                onPosted={() => setPhase('closed')}
                plate={
                  sent && (
                    <span className="lp-door-plate">
                      <span className="block lp-eyebrow lp-ink-caption">Received · Pending review</span>
                      <span className="block lp-dateline mt-1" style={{ fontSize: '1.0625rem' }}>
                        {sent.firstName} · {formatDate(sent.at)}
                      </span>
                    </span>
                  )
                }
              />
            </div>

            {done && (
              <>
                <p className="lp-body lp-ink-secondary mt-4 mx-auto">
                  {restored && <>An application was already sent from this device on {formatDate(sent.at)}. </>}
                  {sent.forFriend ? (
                    <>
                      It’s now <strong className="font-semibold text-primary">pending review</strong> by the Secretary. When they
                      verify it with {sent.firstName} in person, they’ll give {sent.firstName} a one-time link to set their own
                      password. After that, {sent.firstName} can log in.
                    </>
                  ) : (
                    <>
                      It’s now <strong className="font-semibold text-primary">pending review</strong> by the Secretary. You can log
                      in any time to check your status. You’ll gain full member access (QR card, events, attendance) once
                      approved.
                    </>
                  )}
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-9">
                  <Link to="/login" className="lp-btn lp-btn--primary">
                    {sent.forFriend ? 'Go to login' : 'Log in to check my status'} <span className="lp-btn__arrow" aria-hidden="true">→</span>
                  </Link>
                  <Link to="/" className="lp-btn lp-btn--ghost">
                    Back to the front page
                  </Link>
                </div>

                <div className="lp-card lp-card--past p-6 sm:p-8 mt-14 text-left">
                  <p className="lp-eyebrow lp-ink-caption">One application per student</p>
                  <h2 className="lp-h3 mt-3" style={{ fontSize: '1.375rem' }}>
                    Applying for a friend who’s with you?
                  </h2>
                  <p className="lp-body lp-ink-secondary mt-3" style={{ fontSize: '1rem' }}>
                    If a friend didn’t bring a device, you can lend them this one. They must be here with you and read the terms
                    themselves. The same student ID or email can’t be sent twice, whichever device it comes from.
                  </p>
                  <button type="button" onClick={startFriendApplication} className="lp-btn lp-btn--ghost mt-6">
                    Start an application for a friend
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </PublicPage>
    );
  }

  // ---------------------------------------------------------------- The form
  return (
    <PublicPage hideChapterNav>
      <PageMasthead
        eyebrow={forFriend ? 'Membership application · On behalf of a friend' : 'Membership application'}
        title={
          forFriend ? (
            <>
              Applying for <em className="text-primary">a friend.</em>
            </>
          ) : (
            <>
              Apply to <em className="text-primary">join the record.</em>
            </>
          )
        }
        lead={
          forFriend
            ? 'Your friend needs to be here with you. They read the terms and confirm them themselves; you’re only lending the device.'
            : 'It takes about two minutes. Before you submit, you’ll open the membership terms and confirm you understand them.'
        }
      >
        {forFriend ? (
          <button type="button" onClick={leaveFriendMode} className="lp-link py-0 lp-small">
            Cancel. I’m not applying for someone else
          </button>
        ) : (
          <p className="lp-small lp-ink-secondary">
            Already applied?{' '}
            <Link to="/login" className="lp-link py-0">
              Log in to check your status
            </Link>
          </p>
        )}
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

            {forFriend && (
              <Fieldset legend="Who’s helping">
                <div>
                  <label htmlFor="apply-helper" className="lp-label">Your name</label>
                  <input id="apply-helper" type="text" autoComplete="name" required value={helperName} onChange={(e) => setHelperName(e.target.value)} aria-describedby="apply-helper-hint" className="lp-input" />
                  <p id="apply-helper-hint" className="lp-hint">
                    So the Secretary knows who submitted this. It’s deleted once the application is decided.
                  </p>
                </div>
              </Fieldset>
            )}

            <Fieldset legend={forFriend ? 'Your friend’s details' : 'Your details'}>
              <div>
                <label htmlFor="apply-name" className="lp-label">{forFriend ? 'Their full name' : 'Full name'}</label>
                <input id="apply-name" type="text" autoComplete={forFriend ? 'off' : 'name'} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Dela Cruz" className="lp-input" />
              </div>
              <div>
                <label htmlFor="apply-email" className="lp-label">{forFriend ? 'Their email address' : 'Email address'}</label>
                <input id="apply-email" type="email" autoComplete={forFriend ? 'off' : 'email'} required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@nwssu.edu.ph" className="lp-input" />
              </div>
              <div>
                <label htmlFor="apply-student-id" className="lp-label">{forFriend ? 'Their student ID number' : 'Student ID number'}</label>
                <input
                  id="apply-student-id"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck={false}
                  required
                  maxLength={9}
                  placeholder="23-00877"
                  value={studentId}
                  onChange={(e) => setStudentId(formatStudentId(e.target.value))}
                  aria-describedby="apply-student-id-hint"
                  className="lp-input"
                />
                <p id="apply-student-id-hint" className="lp-hint">
                  As printed on the NwSSU school ID: the year enrolled, then the student number (e.g. 23-00877). It’s stored
                  encrypted and only the Secretary can read it while reviewing.
                  That readable copy is deleted once the application is decided; only a one-way fingerprint is kept, so the
                  same ID can’t apply twice.
                </p>
              </div>
            </Fieldset>

            <Fieldset legend={forFriend ? 'Their studies' : 'Your studies'}>
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

            {forFriend ? (
              <Fieldset legend="Their account">
                <p className="lp-notice lp-notice--success">
                  No password needed now. {friendFirst === 'your friend' ? 'Your friend' : friendFirst} will set their own: the
                  Secretary gives them a one-time link when they verify the application in person.
                </p>
              </Fieldset>
            ) : (
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
            )}

            <Fieldset legend="The membership terms">
              <MembershipEnvelope ref={sealRef} opened={termsOpened} onOpen={() => setTermsOpened(true)} controlsId="apply-terms" />

              {!termsOpened ? (
                <p className="lp-small lp-ink-muted text-center" style={{ fontWeight: 400 }}>
                  {forFriend
                    ? `Hand the device to ${friendFirst} to break the seal. They need to understand the terms and confirm them before you can submit.`
                    : 'Break the seal to read the terms. You’ll need to understand them — and confirm — before you can submit.'}
                </p>
              ) : (
                <div id="apply-terms" className="lp-terms">
                  <div>
                    <div className="lp-card lp-card--past p-6 sm:p-8">
                      <p className="lp-eyebrow lp-ink-caption">Article III · Membership</p>
                      <h3 ref={setTermsHeading} tabIndex={-1} className="lp-h3 mt-3 focus:outline-none" style={{ fontSize: '1.5rem' }}>
                        {forFriend ? `${friendFirst === 'your friend' ? 'Your friend' : friendFirst}, you need to understand this first.` : 'You need to understand this first.'}
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
                          {forFriend && <>I, {name.trim() || 'the applicant'}, </>}
                          {forFriend ? 'have' : 'I have'} read and understood these terms. I am a bona fide NwSSU student, I support
                          USWAG’s three core advocacies, and I agree to the membership requirements of Article III of the
                          Constitution.
                        </span>
                      </label>

                      <p className="lp-dateline lp-ink-secondary mt-6 text-right" style={{ fontSize: '1rem' }}>
                        Signed, <span className="border-b border-dotted border-[var(--lp-sepia)] px-2">{name.trim() || '________________'}</span>
                      </p>

                      {forFriend && (
                        <label htmlFor="apply-attest" className="mt-6 pt-6 border-t border-dotted border-[rgb(122_98_66/0.45)] flex items-start gap-3.5 cursor-pointer">
                          <input
                            ref={attestRef}
                            id="apply-attest"
                            type="checkbox"
                            className="lp-check"
                            checked={attested}
                            onChange={(e) => setAttested(e.target.checked)}
                          />
                          <span className="text-[0.9375rem] leading-[1.6] font-medium">
                            I, {helperName.trim() || 'the helper'}, confirm that {name.trim() || 'my friend'} is here with me, read
                            these terms themselves, and asked me to submit this application for them.
                          </span>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Fieldset>

            <div className="space-y-4">
              {error && (
                <p ref={errorRef} role="alert" className="lp-alert">
                  {error}
                </p>
              )}
              <button type="submit" className="lp-btn lp-btn--primary w-full">
                {forFriend ? `Seal & send ${friendFirst === 'your friend' ? 'their' : `${friendFirst}’s`} application` : 'Seal & send my application'}
                <span className="lp-btn__arrow" aria-hidden="true">→</span>
              </button>
              {!forFriend && (
                <p className="lp-small lp-ink-muted text-center" style={{ fontWeight: 400 }}>
                  Already applied?{' '}
                  <Link to="/login" className="lp-link py-0">Log in to check your status</Link>
                </p>
              )}
            </div>
          </form>

          <aside className="lg:col-span-5 lg:sticky lg:top-28" aria-labelledby="apply-next">
            <SectionHeading id="apply-next" eyebrow="What happens next" title={forFriend ? 'From their envelope to their card' : 'From envelope to card'} />
            <ol className="mt-10 space-y-6">
              {(forFriend ? FRIEND_STEPS : NEXT_STEPS).map((s) => (
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
