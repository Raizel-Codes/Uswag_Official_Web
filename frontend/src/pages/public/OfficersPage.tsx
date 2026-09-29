import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { officerService } from '../../services/officerService';
import { useLandingReveal } from '@/hooks/useLandingReveal';
import OfficerAvatar from '@/components/common/OfficerAvatar';
import PublicPage from '@/components/landing/PublicPage';
import PageMasthead from '@/components/landing/PageMasthead';
import SectionHeading from '@/components/landing/SectionHeading';
import LandingCTA from '@/components/landing/sections/LandingCTA';
import OfficerRosterSheet from '@/components/landing/artifacts/OfficerRosterSheet';
import { FIRST_BATCH, SECOND_BATCH, SECOND_BATCH_YEAR } from '@/components/landing/firstOfficers.data';
import { FOUNDED_YEAR } from '@/components/landing/timeline.data';
import { academicYearLabel } from '@/components/landing/academicYear';

const POSITION_ORDER = ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'AUDITOR', 'BUSINESS_MANAGER', 'PRO'];

const POSITION_LABELS: Record<string, string> = {
  PRESIDENT: 'President',
  VICE_PRESIDENT: 'Vice President',
  SECRETARY: 'Secretary',
  TREASURER: 'Treasurer',
  AUDITOR: 'Auditor',
  BUSINESS_MANAGER: 'Business Manager',
  PRO: 'Public Relations Officer',
};

// Verbatim from Constitution Art. VI §2 (docs/01 - USWAG Constitution and Bylaws.pdf).
const POSITION_DUTIES: Record<string, string[]> = {
  PRESIDENT: [
    'Serve as the official representative of the organization.',
    'Preside over meetings and enforce the Constitution and By-Laws.',
    'Call for special meetings when necessary.',
    'Submit an annual report at the end of the academic year.',
  ],
  VICE_PRESIDENT: [
    'Assume the duties of the President in their absence.',
    'Supervise and coordinate the work of all officers and committees as delegated by the President.',
  ],
  SECRETARY: [
    'Record and keep minutes of all meetings.',
    'Maintain organizational records and official documents.',
    'Prepare the roster of members and handle correspondence.',
    'Notify members of scheduled meetings.',
  ],
  TREASURER: [
    'Manage and safeguard the organization’s funds and properties.',
    'Collect dues and fees as approved by the body.',
    'Prepare and present financial statements every semester.',
  ],
  AUDITOR: [
    'Examine and audit financial records.',
    'Prepare and submit audit reports every semester.',
    'Coordinate with the Treasurer to ensure accuracy and transparency.',
  ],
  BUSINESS_MANAGER: [
    'Source and purchase necessary materials for organizational activities.',
    'Coordinate with the Secretary, Treasurer, and Auditor regarding purchases.',
  ],
  PRO: [
    'Disseminate announcements and publicity materials through bulletins and social media.',
    'Foster engagement and model good conduct to members, especially lower years.',
  ],
};

function FirstBatch() {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);
  return (
    <section ref={ref} aria-labelledby="off-first" data-era="past" className="lp-section lp-grain lp-grain--fade">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-12 lg:gap-14 items-start">
        <div className="lg:col-span-5">
          <SectionHeading
            id="off-first"
            tone="past"
            eyebrow={`The first batch · ${FOUNDED_YEAR}`}
            title="The officers who started it"
            lead="Every roster since traces back to the students who first held these posts. Their names are being confirmed with our adviser so they can be recorded here properly."
          />
        </div>
        <div className="lg:col-span-7" data-lp-reveal>
          <OfficerRosterSheet
            batch={FIRST_BATCH}
            captionLabel="founding officers"
            pendingNote="Names pending confirmation with the USWAG adviser"
            edgeSeed={2011}
          />
        </div>
      </div>
    </section>
  );
}

function SecondBatch() {
  const ref = useRef<HTMLElement>(null);
  useLandingReveal(ref);
  return (
    <section ref={ref} aria-labelledby="off-second" data-era="past" className="lp-section lp-grain lp-grain--fade">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 grid lg:grid-cols-12 gap-12 lg:gap-14 items-start">
        <div className="lg:col-span-5 lg:order-2">
          <SectionHeading
            id="off-second"
            tone="past"
            eyebrow={`The second batch · ${SECOND_BATCH_YEAR}`}
            title="The officers who followed"
            lead="Six executive officers and three college commissioners. Each commissioner is the Public Relations Officer of their college."
          />
        </div>
        <div className="lg:col-span-7 lg:order-1" data-lp-reveal>
          <OfficerRosterSheet
            batch={SECOND_BATCH}
            captionLabel="second-batch officers"
            pendingNote="Names pending confirmation with the USWAG adviser"
            edgeSeed={SECOND_BATCH_YEAR}
            tilt={6}
          />
        </div>
      </div>
    </section>
  );
}

function CurrentOfficers() {
  const ref = useRef<HTMLElement>(null);
  const { data: officers = [], isLoading, isError } = useQuery({
    queryKey: ['publicOfficers'],
    queryFn: officerService.getPublicRoster,
  });
  useLandingReveal(ref, [officers.length, isLoading]);

  const sorted = [...officers].sort((a, b) => {
    const ai = POSITION_ORDER.indexOf(a.officerPosition);
    const bi = POSITION_ORDER.indexOf(b.officerPosition);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <section ref={ref} aria-labelledby="off-current" data-era="present" className="lp-section" data-lp-era-end>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading
            id="off-current"
            eyebrow={`Today’s stewards · A.Y. ${academicYearLabel()}`}
            title="The officers serving now"
            lead="Seven constitutional positions, each with duties set out in Article VI. Officers serve for one academic year and must be regular NwSSU students."
          />
          <ol className="flex flex-wrap gap-2 max-w-[520px]" aria-label="Order of positions" data-lp-reveal>
            {POSITION_ORDER.map((p, i) => (
              <li key={p} className="lp-small inline-flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-full border border-[rgb(20_39_24/0.2)]">{POSITION_LABELS[p]}</span>
                {i < POSITION_ORDER.length - 1 && <span className="text-primary" aria-hidden="true">→</span>}
              </li>
            ))}
          </ol>
        </div>

        {isError && (
          <p className="lp-alert mt-12" role="alert">
            We couldn’t load the officer roster right now. Please try again in a moment.
          </p>
        )}

        {isLoading ? (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-14" aria-busy="true" aria-label="Loading officers">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="lp-card p-6">
                <div className="lp-skeleton w-20 h-20 rounded-full" />
                <div className="lp-skeleton h-4 w-2/3 mt-5" />
                <div className="lp-skeleton h-3 w-1/2 mt-3" />
                <div className="lp-skeleton h-3 w-full mt-6" />
                <div className="lp-skeleton h-3 w-4/5 mt-2" />
              </li>
            ))}
          </ul>
        ) : !isError && sorted.length === 0 ? (
          <p className="lp-card p-10 mt-14 text-center lp-body lp-ink-muted mx-auto">
            The roster for this academic year hasn’t been published yet. Check back soon.
          </p>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
            {sorted.map((o) => {
              const label = POSITION_LABELS[o.officerPosition] ?? o.officerPosition.replace(/_/g, ' ');
              const duties = POSITION_DUTIES[o.officerPosition] ?? [];
              return (
                <li key={o.id} className="lp-card lp-lift p-6 sm:p-7 flex flex-col" data-lp-reveal>
                  <div className="flex items-center gap-4">
                    <div className="lp-cameo w-20 h-20 shrink-0 flex items-center justify-center">
                      {o.photoUrl ? (
                        <img src={o.photoUrl} alt="" loading="lazy" decoding="async" width={80} height={80} className="w-full h-full object-cover" />
                      ) : (
                        <OfficerAvatar seed={o.id} className="w-[78%] h-[78%] object-contain" />
                      )}
                    </div>
                    <div>
                      <p className="lp-eyebrow text-primary">{label}</p>
                      <h3 className="font-display text-[1.25rem] font-medium leading-tight mt-1.5">{o.name}</h3>
                      <p className="lp-small lp-ink-muted mt-1">{o.collegeOrDept}</p>
                    </div>
                  </div>
                  {duties.length > 0 && (
                    <ul className="mt-6 pt-5 border-t border-[rgb(20_39_24/0.1)] space-y-2">
                      {duties.map((d) => (
                        <li key={d} className="flex gap-3 text-[0.875rem] leading-[1.6] lp-ink-muted">
                          <span className="mt-[0.5rem] w-1.5 h-1.5 rotate-45 bg-primary shrink-0" aria-hidden="true" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export default function OfficersPage() {
  return (
    <PublicPage eraStart="#off-current">
      <PageMasthead
        eyebrow="Our leadership"
        title={
          <>
            From the first batch <em className="text-primary">to today’s stewards.</em>
          </>
        }
        lead="Seven constitutional positions carry USWAG forward — each one set out, with its duties, in Article VI of our Constitution."
      />
      <FirstBatch />
      <SecondBatch />
      <CurrentOfficers />
      <LandingCTA
        id="off-cta"
        eyebrow="Officer duties are constitutional"
        title="Every duty is written down."
        body="The responsibilities of each position — and how officers are elected — are codified in Articles VI and VII of the USWAG Constitution."
        primary={{ to: '/bylaws', label: 'Read the Constitution' }}
        secondary={{ to: '/join', label: 'Become a member' }}
        note="Officers serve for one academic year."
      />
    </PublicPage>
  );
}
