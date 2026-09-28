import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import PublicPage from '@/components/landing/PublicPage';
import PageMasthead from '@/components/landing/PageMasthead';
import SectionHeading from '@/components/landing/SectionHeading';
import YearsTimeline from '@/components/landing/sections/YearsTimeline';
import { FOUNDED_YEAR } from '@/components/landing/timeline.data';

/*
  Constitutional text below is quoted verbatim from docs/01 - USWAG Constitution and Bylaws.pdf
  (Preamble, Art. I, Art. II, Art. III). Keep it in sync if the Constitution is amended (Art. IX).
*/

const PURPOSES = [
  'To promote meaningful youth voice and participation in student leadership and governance.',
  'To foster awareness, compassion, and responsiveness to mental health and wellness concerns within the university community.',
  'To cultivate environmental leadership and sustainable practices through green initiatives and student-led environmental programs.',
  'To support holistic student growth through civic, academic, and developmental projects.',
  'To maintain a presence beyond student elections through sustained programs for the common good.',
];

function Preamble() {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);
  return (
    <section ref={ref} aria-labelledby="about-preamble" data-era="past" className="lp-section lp-grain">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <SectionHeading id="about-preamble" tone="past" eyebrow="The Preamble" title="In our own words" />
        </div>
        <figure className="lg:col-span-8" data-lp-reveal>
          <blockquote className="lp-body lp-dropcap font-display" style={{ fontSize: '1.1875rem', lineHeight: 1.8, maxWidth: '64ch' }}>
            We, the members of USWAG — United Students Working for Advocacy and Growth, bound by our collective desire to
            uphold youth voice, promote mental health and wellness, and lead environmental advocacy, hereby establish this
            Constitution and By-Laws. Inspired by our duty as student leaders and changemakers, we dedicate ourselves to
            creating inclusive spaces, raising awareness, and fostering sustainable and participatory leadership for the
            betterment of the student body and our communities. Guided by these principles, we commit to uphold unity,
            accountability, and service in all our endeavors at Northwest Samar State University.
          </blockquote>
          <figcaption className="lp-eyebrow lp-ink-secondary mt-6 flex items-center gap-3">
            <span className="h-px w-8 bg-current" aria-hidden="true" />
            Preamble, USWAG Constitution &amp; By-Laws
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

function Articles() {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);
  return (
    <section ref={ref} aria-labelledby="about-articles" data-era="past" className="lp-section lp-grain lp-grain--fade" data-lp-era-start>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <SectionHeading
          id="about-articles"
          tone="past"
          eyebrow="From the Constitution"
          title="Name, purpose, and membership"
          lead="The articles that define what USWAG is — the same foundation every officer term builds on."
        />

        <div className="grid lg:grid-cols-3 gap-10 lg:gap-12 mt-14">
          <article className="lp-doc" data-lp-reveal>
            <p className="lp-eyebrow lp-ink-caption">Article I · Name</p>
            <p className="lp-body mt-4" style={{ fontSize: '1rem' }}>
              <strong className="font-semibold">Section 1.</strong> The name of this organization shall be USWAG — United
              Students Working for Advocacy and Growth (and shall be considered as an institutional affiliation) of Northwest
              Samar State University.
            </p>
            <p className="lp-body" style={{ fontSize: '1rem' }}>
              <strong className="font-semibold">Section 2.</strong> USWAG shall represent a cause-driven student organization
              dedicated to leadership, advocacy, and developmental initiatives within and beyond the university.
            </p>
          </article>

          <article className="lp-doc" data-lp-reveal>
            <p className="lp-eyebrow lp-ink-caption">Article II · Purpose</p>
            <p className="lp-body mt-4" style={{ fontSize: '1rem' }}>
              <strong className="font-semibold">Section 1.</strong> The purpose of the organization shall be:
            </p>
            <ol className="lp-body" style={{ fontSize: '1rem' }}>
              {PURPOSES.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ol>
          </article>

          <article className="lp-doc" data-lp-reveal>
            <p className="lp-eyebrow lp-ink-caption">Article III · Membership</p>
            <p className="lp-body mt-4" style={{ fontSize: '1rem' }}>
              <strong className="font-semibold">Section 1.</strong> Membership is open to all bona fide students of Northwest
              Samar State University who support the vision and mission of USWAG.
            </p>
            <p className="lp-body" style={{ fontSize: '1rem' }}>
              <strong className="font-semibold">Section 3.</strong> Membership is valid for one academic year and is renewable
              annually.
            </p>
            <Link to="/join" className="lp-link mt-3">
              How to become a member <span aria-hidden="true">→</span>
            </Link>
          </article>
        </div>

        <div className="mt-12" data-lp-reveal>
          <Link to="/bylaws" className="lp-btn lp-btn--ghost">
            Read the full Constitution &amp; By-Laws <span className="lp-btn__arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Legacy() {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);
  return (
    <section ref={ref} aria-labelledby="about-legacy" data-era="present" className="lp-section" data-lp-era-end>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-6">
          <SectionHeading
            id="about-legacy"
            eyebrow={`History & legacy · Since ${FOUNDED_YEAR}`}
            title="Built to outlast any one term"
          />
          <div className="mt-8 space-y-5" data-lp-reveal>
            <p className="lp-body lp-ink-muted">
              USWAG was founded by student leaders who recognized that traditional student politics often ended when the
              elections were over. It was established to be an enduring vehicle for student causes — mental health,
              environmental action, and continuous civic engagement.
            </p>
            <p className="lp-body lp-ink-muted">
              By anchoring its purpose in a written Constitution rather than individual personalities, the organization
              ensures that its programs outlast any single set of officers. It is built on the principle of institutional
              continuity.
            </p>
          </div>
        </div>

        <figure className="lg:col-span-5 lg:col-start-8 lp-card p-8" data-lp-reveal>
          <div className="flex items-center gap-4">
            <span
              className="lp-seal w-14 h-14 font-display text-[1.25rem]"
              aria-hidden="true"
            >
              AH
            </span>
            <div>
              <p className="font-display text-[1.125rem] font-medium leading-tight">Arnelyn Heleran</p>
              <p className="lp-eyebrow text-primary mt-1">Faculty Adviser</p>
            </div>
          </div>
          <blockquote className="font-display italic text-[1.125rem] leading-[1.65] mt-6">
            “USWAG represents the best of student initiative at NwSSU. They don’t just point out problems; they mobilize,
            build programs, and take responsibility for their campus community.”
          </blockquote>
          <figcaption className="lp-small lp-ink-muted mt-4">— Message from the adviser</figcaption>
        </figure>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <PublicPage>
      <PageMasthead
        eyebrow="About USWAG"
        title={
          <>
            Who we are, <em className="text-primary">in our own words.</em>
          </>
        }
        lead="United Students Working for Advocacy and Growth — a cause-driven student organization at Northwest Samar State University since 2010, grounded in its written Constitution."
      />
      <Preamble />
      <Articles />
      <YearsTimeline eyebrow={`Since ${FOUNDED_YEAR}`} />
      <Legacy />
    </PublicPage>
  );
}
