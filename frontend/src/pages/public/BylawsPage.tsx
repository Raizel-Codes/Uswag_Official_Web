import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import PublicPage from '@/components/landing/PublicPage';
import PageMasthead from '@/components/landing/PageMasthead';
import SectionHeading from '@/components/landing/SectionHeading';
import LandingCTA from '@/components/landing/sections/LandingCTA';
import EngravedCrest from '@/components/landing/artifacts/EngravedCrest';
import RubberStamp from '@/components/landing/ornaments/RubberStamp';

interface Amendment {
  id: string;
  article: string;
  section: string;
  proposedText: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

/*
  Plain-language summaries of Articles I–X of docs/01 - USWAG Constitution and Bylaws.pdf
  (identical to /constitution.pdf). The PDF is the authoritative text — keep these in step with
  it whenever an amendment is approved (Art. IX).
*/
const ARTICLES: { n: string; title: string; summary: string; link?: { to: string; label: string } }[] = [
  {
    n: 'I',
    title: 'Name',
    summary:
      'The organization is USWAG — United Students Working for Advocacy and Growth — an institutional affiliation of Northwest Samar State University: a cause-driven student organization dedicated to leadership, advocacy, and developmental initiatives within and beyond the university.',
  },
  {
    n: 'II',
    title: 'Purpose',
    summary:
      'Five purposes: meaningful youth voice in student leadership and governance; awareness and responsiveness to mental health and wellness; environmental leadership and sustainable practice; holistic student growth; and a presence beyond student elections through sustained programs. It names three core causes — Youth Voice and Participation, Mental Health and Wellness Awareness, and Environmental Leadership.',
    link: { to: '/advocacies', label: 'The three advocacies' },
  },
  {
    n: 'III',
    title: 'Membership',
    summary:
      'Open to all bona fide NwSSU students who support USWAG’s vision and mission. To join, a student submits a membership form, pays the membership fee set by the officers and approved by the adviser, and attends an orientation. Membership is valid for one academic year and is renewable annually.',
    link: { to: '/join', label: 'How to join' },
  },
  {
    n: 'IV',
    title: 'Rights and Privileges of Members',
    summary:
      'Members may vote and be voted upon; express opinions, suggestions, and ideas in meetings and planning sessions; and access relevant, approved organizational records. They may also take part in USWAG’s seminars, workshops, symposia, forums, and other activities.',
  },
  {
    n: 'V',
    title: 'Duties and Responsibilities of Members',
    summary:
      'Members are expected to take an active part in USWAG’s initiatives, contributing their time, talents, and resources; to respect the organization’s policies, guidelines, and code of conduct; and to be accountable for supporting its goals and programs.',
  },
  {
    n: 'VI',
    title: 'Officers',
    summary:
      'A President, Vice-President, Secretary, Treasurer, Auditor, Business Manager, and a Public Relations Officer per college/department, each with defined duties. Only regular NwSSU students may hold office, and officers serve for one academic year.',
    link: { to: '/officers', label: 'Officers and their duties' },
  },
  {
    n: 'VII',
    title: 'Meetings, Quorum, and Election',
    summary:
      'Regular meetings are held every last week of the month, and the President may call special meetings. A quorum is one-half of the total active membership plus one. New officers are elected after the Institutional Election at the end of each academic year.',
  },
  {
    n: 'VIII',
    title: 'Advisers',
    summary:
      'The adviser is a regular NwSSU faculty member who facilitates annual planning, supports capacity-building trainings, attends meetings and major events, guides terminal reports to the SARS Office, oversees accreditation and re-accreditation, and serves as the organization’s mentor and guardian (in loco parentis).',
  },
  {
    n: 'IX',
    title: 'Amendments',
    summary:
      'Any member may propose an amendment in writing. A proposed amendment is reviewed by the officers and must be approved by a majority vote at a general assembly where a quorum is present.',
  },
  {
    n: 'X',
    title: 'Effectivity',
    summary: 'The Constitution takes effect upon ratification by the majority of USWAG members.',
  },
];

function TheDocument() {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);
  return (
    <section ref={ref} id="bylaws-articles" aria-labelledby="bylaws-doc" data-era="past" className="lp-section lp-grain lp-grain--fade scroll-mt-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-12">
        {/* Table of contents */}
        <nav aria-labelledby="bylaws-toc" className="lg:col-span-4 lg:sticky lg:top-28 self-start">
          <SectionHeading id="bylaws-doc" tone="past" eyebrow="The document" title="Articles I–X" />
          <p id="bylaws-toc" className="lp-eyebrow lp-ink-caption mt-10">Contents</p>
          <ol className="mt-4 border-t border-[rgb(122_98_66/0.3)]" data-lp-reveal>
            {ARTICLES.map((a) => (
              <li key={a.n} className="border-b border-[rgb(122_98_66/0.3)]">
                <a href={`#art-${a.n}`} className="flex items-baseline gap-4 py-2.5 group hover:text-primary transition-colors">
                  <span className="font-display font-semibold lp-ink-caption w-10 shrink-0 group-hover:text-primary">{a.n}</span>
                  <span className="text-[0.9375rem] font-medium">{a.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Articles */}
        <div className="lg:col-span-8 space-y-6">
          <div className="lp-card lp-card--past p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative overflow-hidden" data-lp-reveal>
            <EngravedCrest size={64} className="shrink-0" />
            <div className="flex-1">
              <p className="font-display text-[1.25rem] font-semibold">USWAG Constitution &amp; By-Laws</p>
              <p className="lp-small lp-ink-secondary mt-1" style={{ fontWeight: 400 }}>
                These are plain-language summaries. The PDF is the official, authoritative text.
              </p>
            </div>
            <a href="/constitution.pdf" download className="lp-btn lp-btn--primary shrink-0">
              Download PDF <span className="lp-btn__arrow" aria-hidden="true">↓</span>
            </a>
          </div>

          {ARTICLES.map((a) => (
            <article key={a.n} id={`art-${a.n}`} aria-labelledby={`art-${a.n}-title`} className="lp-card lp-card--past p-6 sm:p-8 scroll-mt-28 relative" data-lp-reveal>
              <span className="absolute top-5 right-6 text-[3.5rem] lp-outline-num lp-outline-num--light" aria-hidden="true">{a.n}</span>
              <p className="lp-eyebrow lp-ink-caption">Article {a.n}</p>
              <h3 id={`art-${a.n}-title`} className="lp-h3 mt-2 pr-20">{a.title}</h3>
              <p className="lp-body mt-4" style={{ fontSize: '1rem' }}>{a.summary}</p>
              {a.link && (
                <Link to={a.link.to} className="lp-link mt-2">
                  {a.link.label} <span aria-hidden="true">→</span>
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AmendmentsLog() {
  const ref = useRef<HTMLElement>(null);
  const { data: amendments = [], isLoading, isError } = useQuery({
    queryKey: ['amendments-public'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Amendment[] }>('/bylaws/amendments');
      return data.data.filter((a) => a.status === 'APPROVED');
    },
  });
  useLandingReveal(ref, [isLoading, amendments.length]);

  return (
    <section ref={ref} aria-labelledby="bylaws-amendments" data-era="present" className="lp-section" data-lp-era-start data-lp-era-end>
      <div className="max-w-[880px] mx-auto px-4 sm:px-8">
        <SectionHeading
          id="bylaws-amendments"
          eyebrow="Article IX · Public log"
          title="Approved amendments"
          lead="Every approved change to the Constitution is recorded here, in the open."
        />

        <div className="mt-10">
          {isError ? (
            <p role="alert" className="lp-alert">We couldn’t load the amendments log right now. Please try again later.</p>
          ) : isLoading ? (
            <div className="lp-card p-8" aria-busy="true">
              <div className="lp-skeleton h-4 w-1/3" />
              <div className="lp-skeleton h-3 w-full mt-5" />
              <div className="lp-skeleton h-3 w-4/5 mt-2" />
            </div>
          ) : amendments.length === 0 ? (
            <div className="lp-card p-10 text-center" data-lp-reveal>
              <p className="font-display text-[1.25rem]">No approved amendments on record yet.</p>
              <p className="lp-small lp-ink-muted mt-2" style={{ fontWeight: 400 }}>
                When the general assembly approves a change, it will appear here.
              </p>
            </div>
          ) : (
            <ol className="space-y-5">
              {amendments.map((a) => (
                <li key={a.id} className="lp-card p-6 sm:p-8 relative" data-lp-reveal>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <h3 className="font-display font-medium text-[1.1875rem]">
                      Article {a.article}, Section {a.section}
                    </h3>
                    <RubberStamp ring="USWAG · ARTICLE IX · " center="PASSED" size={74} tilt={-8} />
                  </div>
                  <blockquote className="font-display italic text-[1.0625rem] leading-[1.7] mt-3">“{a.proposedText}”</blockquote>
                  <p className="lp-small lp-ink-muted mt-5 pt-4 border-t border-[rgb(20_39_24/0.1)]">
                    Logged <time dateTime={a.createdAt}>{new Date(a.createdAt).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</time>
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

export default function BylawsPage() {
  return (
    <PublicPage>
      <PageMasthead
        sectionLabel="Appendix · Constitution"
        eyebrow="Transparency & accountability"
        title={
          <>
            The Constitution <em className="text-primary">&amp; By-Laws.</em>
          </>
        }
        lead="The governing document of USWAG. Every rule, duty, and process we follow is written here — and open to every student."
      >
        <div className="flex flex-wrap gap-3">
          <a href="/constitution.pdf" download className="lp-btn lp-btn--primary">
            Download the PDF <span className="lp-btn__arrow" aria-hidden="true">↓</span>
          </a>
          <a href="#bylaws-articles" className="lp-btn lp-btn--ghost">
            Read the articles <span className="lp-btn__arrow" aria-hidden="true">↓</span>
          </a>
        </div>
      </PageMasthead>
      <TheDocument />
      <AmendmentsLog />
      <LandingCTA
        id="bylaws-cta"
        eyebrow="Questions about the Constitution?"
        title="Ask an officer."
        body="If a rule, duty, or process isn’t clear, our officers can walk you through it."
        primary={{ to: '/contact', label: 'Contact us' }}
        secondary={{ to: '/about', label: 'About USWAG' }}
        note=""
      />
    </PublicPage>
  );
}
