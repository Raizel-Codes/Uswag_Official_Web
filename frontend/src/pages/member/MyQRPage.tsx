// Member portal — Card. Only the digital membership card (attendance has its own tab).
// Active members: the signed QR from GET /members/me/qr. Everyone else: the card face down,
// the server's reason, and the steps that lead to a card (Article III). The QR is only
// requested for an active member; the server refuses it for anyone else regardless.
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getMyDigitalCard } from '@/services/qrService';
import { useMyProfile } from '@/hooks/useMyProfile';
import PageHeader from '@/components/portal/PageHeader';
import MembershipCard from '@/components/member/MembershipCard';
import StandingNote from '@/components/member/StandingNote';
import { isActive, errorMessage } from '@/components/member/standing';

const STEPS = [
  { title: 'Application submitted', desc: 'Your account was created with a pending status.' },
  { title: 'Secretary review', desc: 'The Secretary checks your application and student ID.' },
  { title: 'Fee & orientation', desc: 'Pay the membership fee and attend an orientation session.' },
  { title: 'Card issued', desc: 'Your signed QR card appears here, ready for events.' },
];

export default function MyQRPage() {
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const active = isActive(profile?.status);

  const card = useQuery({
    queryKey: ['member', 'qr-card'],
    queryFn: getMyDigitalCard,
    enabled: active,
    // QR tokens rarely change — only on annual renewal or admin re-generation.
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

  return (
    <div className="mp-page">
      <PageHeader
        eyebrow="Membership card"
        title={
          active
            ? 'Your card'
            : profile?.status === 'expired'
              ? 'Your card has expired'
              : profile?.status === 'rejected'
                ? 'No card issued'
                : 'Your card is on its way'
        }
        lead={
          active
            ? 'Show this at the event entrance. An officer scans it, and the visit appears under Attendance.'
            : undefined
        }
      />

      <div className="grid lg:grid-cols-[minmax(0,360px)_1fr] gap-10 lg:gap-14 mt-8 items-start">
        <div>
          {profileLoading || (active && card.isLoading) ? (
            <div className="mp-skeleton mx-auto w-full max-w-[340px] aspect-[336/520]" aria-busy="true" aria-label="Loading your card" />
          ) : !profile ? (
            <p className="mp-alert">We couldn’t load your membership. Refresh the page to try again.</p>
          ) : active && card.isError ? (
            <div className="space-y-4">
              <p role="alert" className="mp-alert">{errorMessage(card.error, 'We couldn’t load your card. Check your connection and try again.')}</p>
              <button type="button" onClick={() => card.refetch()} className="mp-btn mp-btn--primary">Try again</button>
            </div>
          ) : (
            <MembershipCard profile={profile} qrValue={card.data?.qrValue} serialNumber={active ? card.data?.serialNumber : undefined} />
          )}
        </div>

        <div className="space-y-8">
          {profile && !active && <StandingNote profile={profile} onCardPage />}

          {profile?.status === 'pending' && (
            <section aria-labelledby="card-steps">
              <h2 id="card-steps" className="mp-h2">What happens next</h2>
              <ol className="mt-5 space-y-4">
                {STEPS.map((s, i) => {
                  const state = i === 0 ? 'done' : i === 1 ? 'current' : 'todo';
                  return (
                    <li key={s.title} className="flex gap-4" aria-current={state === 'current' ? 'step' : undefined}>
                      <span
                        className={`w-9 h-9 shrink-0 rounded-full grid place-items-center font-heading font-semibold text-[0.875rem] ${
                          state === 'todo' ? 'border border-[rgb(20_39_24/0.3)] text-forest' : 'mp-seal'
                        }`}
                        aria-hidden="true"
                      >
                        {state === 'done' ? '✓' : i + 1}
                      </span>
                      <div>
                        <h3 className="mp-h3">
                          {s.title}
                          {state === 'current' && <span className="mp-eyebrow ml-2" style={{ fontSize: '0.6875rem' }}>Now</span>}
                          {state === 'done' && <span className="mp-sr-only"> (done)</span>}
                        </h3>
                        <p className="mp-muted text-[0.9375rem] mt-0.5">{s.desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {active && (
            <section aria-labelledby="card-tips" className="mp-card p-6">
              <h2 id="card-tips" className="mp-h3">At the event</h2>
              <ul className="mt-3 space-y-2 text-[0.9375rem] mp-muted list-disc pl-5">
                <li>Turn your screen brightness up so the scanner reads it first time.</li>
                <li>Every scan is checked live against your membership, so the card only works while it’s active.</li>
                <li>Your card is valid for A.Y. {profile!.academicYear.replace('-', '–')}. Renew each academic year (Article III §3).</li>
              </ul>
              <Link to="/dashboard/attendance" className="mp-link inline-block mt-4 text-[0.875rem]">See your attendance</Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
