import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import { useMembershipFee } from '@/hooks/useMembershipFee';
import PublicPage from '@/components/landing/PublicPage';
import PageMasthead from '@/components/landing/PageMasthead';
import SectionHeading from '@/components/landing/SectionHeading';
import LandingCTA from '@/components/landing/sections/LandingCTA';
import MembershipCardMorph from '@/components/landing/artifacts/MembershipCardMorph';
import { FOUNDED_YEAR } from '@/components/landing/timeline.data';

// `fee` is the Treasurer's current membership fee (useMembershipFee), null until the server has answered.
const faqs = (fee: string | null) => [
  {
    q: 'Do I need prior leadership experience?',
    a: 'No. USWAG is where you build that experience. We welcome anyone willing to learn and actively participate.',
  },
  {
    q: 'How long does my membership last?',
    a: 'Membership is valid for one academic year and is renewable annually (Article III, Section 3), so our roster only reflects currently enrolled, active students.',
  },
  {
    q: 'What if I miss an event?',
    a: 'We understand students are busy. However, falling below the required attendance threshold may affect your eligibility for limited-slot out-of-campus activities.',
  },
  {
    q: 'Is there a deadline for applications?',
    a: 'Applications are typically open at the start of each semester. Watch our Facebook Page and this website for announcements.',
  },
  {
    q: fee ? `What does the ${fee} membership fee cover?` : 'What does the membership fee cover?',
    a: 'The fee covers the cost of QR ID generation, organizational materials, and program seed funding. It is payable to the Treasurer upon approval.',
  },
];

// Art. III §2 (a)–(c), in order — the steps mirror the Constitution.
const STEPS = [
  { n: '1', title: 'Apply online', desc: 'Create an account and submit your completed membership form.' },
  { n: '2', title: 'Pay the membership fee', desc: 'As determined by the officers and approved by the adviser, payable to the Treasurer once your application is approved.' },
  { n: '3', title: 'Attend orientation', desc: 'A short onboarding session on our Constitution and advocacies — then your digital membership card is issued.' },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <div className="border-b border-[rgb(20_39_24/0.12)] last:border-0">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="w-full text-left flex justify-between items-center gap-4 py-5 font-display text-[1.125rem] font-medium hover:text-primary transition-colors"
        >
          {q}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className={`w-6 h-6 shrink-0 text-primary transition-transform duration-300 ${open ? 'rotate-45' : ''}`}
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </button>
      </h3>
      <div id={panelId} hidden={!open} className="pb-5">
        <p className="lp-body lp-ink-muted" style={{ fontSize: '0.9375rem' }}>{a}</p>
      </div>
    </div>
  );
}

function Eligibility() {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);
  const { label: fee } = useMembershipFee();
  return (
    <section ref={ref} aria-labelledby="join-eligibility" data-era="past" className="lp-section lp-grain lp-grain--fade" data-lp-era-start>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5">
          <SectionHeading
            id="join-eligibility"
            tone="past"
            eyebrow="Article III · Membership"
            title="Who can join"
            lead="Open to every NwSSU student who shares the cause — here is exactly what the Constitution asks."
          />
        </div>
        <div className="lg:col-span-7 space-y-6">
          <div className="lp-doc" data-lp-reveal>
            <p className="lp-body" style={{ fontSize: '1.0625rem' }}>
              <strong className="font-semibold">Section 1.</strong> Membership is open to all bona fide students of Northwest
              Samar State University who support the vision and mission of USWAG.
            </p>
            <p className="lp-body" style={{ fontSize: '1.0625rem' }}>
              <strong className="font-semibold">Section 2.</strong> To become a member, a student shall:
            </p>
            <ol className="lp-body" style={{ fontSize: '1.0625rem' }}>
              <li>Submit a completed membership form;</li>
              <li>Pay the membership fee as determined by the officers and approved by the adviser; and</li>
              <li>Attend an orientation or onboarding session.</li>
            </ol>
            <p className="lp-body" style={{ fontSize: '1.0625rem' }}>
              <strong className="font-semibold">Section 3.</strong> Membership is valid for one academic year and is
              renewable annually.
            </p>
          </div>
          <div className="lp-card lp-card--past p-6 sm:p-7" data-lp-reveal>
            <p className="lp-eyebrow lp-ink-caption">Membership dues</p>
            <p className="lp-body mt-3" style={{ fontSize: '1rem' }}>
              {fee ? (
                <>The current annual membership fee is <strong className="font-semibold">{fee}</strong>, payable to the</>
              ) : (
                <>The annual membership fee is set by the officers and approved by the adviser. It is payable to the</>
              )}{' '}
              Treasurer upon approval of your application. It supports our programs and your digital membership card.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Process() {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);
  return (
    <section ref={ref} aria-labelledby="join-process" data-era="present" className="lp-section" data-lp-era-end>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-14 items-center">
        <div className="lg:col-span-6">
          <SectionHeading id="join-process" eyebrow="Three steps" title="From application to card" />
          <ol className="mt-10 space-y-6">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-5" data-lp-reveal>
                <span className="lp-seal w-12 h-12 font-display text-[1.25rem] lp-lnum" aria-hidden="true">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-display font-semibold text-[1.1875rem]">{s.title}</h3>
                  <p className="lp-small lp-ink-muted mt-1 max-w-[46ch]" style={{ fontWeight: 400, fontSize: '0.9375rem' }}>{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="lp-card p-6 mt-10" data-lp-reveal>
            <p className="lp-eyebrow text-primary">Orientation schedule</p>
            <p className="lp-small lp-ink-muted mt-2" style={{ fontWeight: 400, fontSize: '0.9375rem' }}>
              New-member orientations are held at the start of each semester. Dates are announced on our Facebook Page and on
              the <Link to="/news" className="lp-link py-0">News</Link> page.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 mt-10" data-lp-reveal>
            <Link to="/apply" className="lp-btn lp-btn--primary">
              Start your application <span className="lp-btn__arrow" aria-hidden="true">→</span>
            </Link>
            <p className="lp-small lp-ink-muted" style={{ fontWeight: 400 }}>
              Takes about 2 minutes. Log in any time to check your status.
            </p>
          </div>
        </div>

        <div className="lg:col-span-6" data-lp-reveal>
          <MembershipCardMorph foundedYear={FOUNDED_YEAR} />
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);
  const { label: fee } = useMembershipFee();
  return (
    <section ref={ref} aria-labelledby="join-faq" data-era="present" className="lp-section pt-0">
      <div className="max-w-[880px] mx-auto px-4 sm:px-8">
        <SectionHeading id="join-faq" eyebrow="Before you apply" title="Frequently asked questions" />
        <div className="lp-card px-6 sm:px-8 py-2 mt-10" data-lp-reveal>
          {faqs(fee).map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function JoinUsPage() {
  return (
    <PublicPage>
      <PageMasthead
        eyebrow="Membership"
        title={
          <>
            Add your name <em className="text-primary">to the record.</em>
          </>
        }
        lead="Become part of a student organization committed to Youth Voice, Mental Health & Wellness, and Environmental Leadership."
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/apply" className="lp-btn lp-btn--primary">
            Start your application <span className="lp-btn__arrow" aria-hidden="true">→</span>
          </Link>
          <a href="#join-eligibility" className="lp-btn lp-btn--ghost">
            Who can join <span className="lp-btn__arrow" aria-hidden="true">↓</span>
          </a>
        </div>
      </PageMasthead>
      <Eligibility />
      <Process />
      <Faq />
      <LandingCTA
        id="join-cta"
        eyebrow="Still have questions?"
        title="Talk to an officer."
        body="Reach out to our officers directly — we’re here to help you get started."
        primary={{ to: '/contact', label: 'Contact us' }}
        secondary={{ to: '/officers', label: 'Meet the officers' }}
        note=""
      />
    </PublicPage>
  );
}
