// Install a newly elected batch of officers (Article VI §4). The list only offers ACTIVE members, and
// the server re-checks every pick. Someone who isn't an account yet is added first ("Add an officer
// account", just above) or goes through the normal application; either way the person must be an
// active member before they can hold a seat.
//
// Seats follow Article VI §1: one each for the President, Vice President, Secretary, Treasurer,
// Auditor and Business Manager, plus one Public Relations Officer per college/department. A PRO seat
// only offers members of that college. Seats can stay vacant (not every college has a PRO every year).
//
// Two steps in one plate: a ballot (one row per seat), then a review of who takes office and who
// steps down before anything is written.

import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { installOfficerTerm, listOfficerNominees, type OfficerNominee, type OfficerUser } from '@/services/adminService';
import { COLLEGES } from '@/config/colleges';
import Panel from '@/components/portal/Panel';
import { apiError, currentAcademicYear } from '@/components/admin/format';

const POSITIONS = ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'AUDITOR', 'BUSINESS_MANAGER', 'PRO'] as const;
type Position = (typeof POSITIONS)[number];

// What each seat opens up, in plain words — from the officer scopes in CLAUDE.md / role.middleware.ts.
const SEAT: Record<Position, { label: string; scope: string }> = {
  PRESIDENT: { label: 'President', scope: 'Runs the Super Admin console' },
  VICE_PRESIDENT: { label: 'Vice President', scope: 'Super Admin access, delegated' },
  SECRETARY: { label: 'Secretary', scope: 'Members, minutes, announcements' },
  TREASURER: { label: 'Treasurer', scope: 'Dues, expenses, statements' },
  AUDITOR: { label: 'Auditor', scope: 'Read-only oversight, audit reports' },
  BUSINESS_MANAGER: { label: 'Business Manager', scope: 'Purchase requests, suppliers' },
  PRO: { label: 'Public Relations Officer', scope: 'News posts, Facebook sync' },
};

interface Seat {
  key: string;
  position: Position;
  label: string;
  scope: string;
  /** PRO seats only: the college whose members can fill it. */
  college?: string;
}

const SEATS: Seat[] = [
  ...POSITIONS.filter((p) => p !== 'PRO').map((p) => ({ key: p, position: p, label: SEAT[p].label, scope: SEAT[p].scope })),
  ...COLLEGES.map((c) => ({ key: `PRO:${c}`, position: 'PRO' as const, label: `PRO · ${c}`, scope: `Public Relations Officer of ${c}`, college: c })),
];

/** The seat an officer sits in now. */
const seatKeyOf = (o: OfficerUser) => (o.officerPosition === 'PRO' ? `PRO:${o.collegeOrDept}` : (o.officerPosition ?? ''));

const seatName = (o: OfficerUser) => {
  const p = o.officerPosition;
  if (!p || !(p in SEAT)) return 'Officer';
  return p === 'PRO' ? `PRO · ${o.collegeOrDept}` : SEAT[p as Position].label;
};
const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');

export default function InstallTermPanel({ officers, onDone }: { officers: OfficerUser[]; onDone: (msg: string) => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: nominees = [], isLoading, error: loadError } = useQuery<OfficerNominee[]>({
    queryKey: ['officer-nominees'],
    queryFn: listOfficerNominees,
  });

  // Start from the sitting officers who are still active members, so re-electing someone is "change
  // nothing"; only the seats that really change need touching. `picks` holds the Super Admin's edits.
  const nomineeIds = new Set(nominees.map((n) => n.id));
  const current: Record<string, string> = {};
  for (const o of officers) {
    const key = seatKeyOf(o);
    if (SEATS.some((s) => s.key === key) && nomineeIds.has(o.id)) current[key] = o.id;
  }
  const [picks, setPicks] = useState<Record<string, string>>({});
  const valueFor = (s: Seat) => picks[s.key] ?? current[s.key] ?? '';

  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosen = SEATS.flatMap((s) => (valueFor(s) ? [{ seat: s, userId: valueFor(s) }] : []));
  const chosenIds = new Set(chosen.map((c) => c.userId));
  const byId = new Map(nominees.map((n) => [n.id, n]));
  const steppingDown = officers.filter((o) => !chosenIds.has(o.id));
  const vacant = SEATS.filter((s) => !valueFor(s));
  const vacantPros = vacant.filter((s) => s.college).map((s) => s.college!);
  const vacantOthers = vacant.filter((s) => !s.college).map((s) => s.label);
  const iAmStepping = steppingDown.some((o) => o.id === user?.id);

  const mutation = useMutation({
    mutationFn: () => installOfficerTerm(chosen.map((c) => ({ userId: c.userId, officerPosition: c.seat.position }))),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['officers'] });
      queryClient.invalidateQueries({ queryKey: ['officer-nominees'] });
      setPicks({});
      setReviewing(false);
      const down = result.steppedDown.length;
      onDone(`Term installed · ${result.installed.length} in office${down ? `, ${down} stepped down` : ''}`);
    },
    onError: (err) => {
      setReviewing(false);
      setError(apiError(err, 'Could not install the term. Please try again.'));
    },
  });

  function review(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!valueFor(SEATS[0]!)) return setError('Choose a President — the President runs the Super Admin console.');
    setReviewing(true);
  }

  return (
    <Panel
      title={`Install the ${currentAcademicYear()} term`}
      id="install-term"
      flush
      aside={<span className="mp-standing mp-standing--neutral">{chosen.length} of {SEATS.length} seats filled</span>}
    >
      {!reviewing ? (
        <form onSubmit={review} noValidate>
          <p className="ap-panel__body pb-2 mp-muted text-[0.9375rem] leading-relaxed">
            Seat the officers elected for the coming term. Anyone in office who isn’t seated steps down to a regular member.
            Only <strong className="font-semibold text-[color:var(--color-deep)]">active members</strong> can be chosen. Each college has one PRO (Article VI §1g),
            chosen from that college’s members.
          </p>

          {loadError && <p role="alert" className="mp-alert mx-5 sm:mx-6 mb-3">{apiError(loadError, 'We couldn’t load the active members.')}</p>}

          <ul className="ap-list">
            {SEATS.map((s, i) => {
              const picked = valueFor(s);
              const tag = !picked ? null : picked === current[s.key] ? 'Re-elected' : 'New';
              const options = s.college ? nominees.filter((n) => n.collegeOrDept === s.college) : nominees;
              const firstPro = s.college && !SEATS[i - 1]?.college;
              return (
                <li key={s.key}>
                  {firstPro && (
                    <div className="px-5 sm:px-6 pt-5 pb-1">
                      <p className="mp-eyebrow" style={{ fontSize: '0.6875rem' }}>Public Relations Officers · one per college</p>
                    </div>
                  )}
                  <div className="grid gap-2 px-5 py-3.5 sm:px-6 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:gap-6 sm:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <label htmlFor={`term-${s.key}`} className="font-heading font-semibold text-[0.9375rem]">{s.label}</label>
                        {tag && (
                          <span className={`mp-standing ${tag === 'New' ? 'mp-standing--info' : 'mp-standing--neutral'}`} style={{ fontSize: '0.6875rem', padding: '0.125rem 0.5rem' }}>
                            {tag}
                          </span>
                        )}
                      </div>
                      <p className="mp-muted text-[0.8125rem] mt-0.5">{s.scope}</p>
                    </div>
                    <select
                      id={`term-${s.key}`}
                      value={picked}
                      disabled={isLoading}
                      onChange={(e) => setPicks((prev) => ({ ...prev, [s.key]: e.target.value }))}
                      className="ap-input"
                    >
                      <option value="">{isLoading ? 'Loading members…' : 'Vacant'}</option>
                      {options.map((n) => (
                        <option key={n.id} value={n.id} disabled={chosenIds.has(n.id) && picked !== n.id}>
                          {n.name} · {n.collegeOrDept}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="border-t px-5 py-4 sm:px-6 flex flex-wrap items-center gap-x-6 gap-y-3" style={{ borderColor: 'rgb(20 39 24 / 0.1)' }}>
            <p className="ap-hint mt-0 flex-1 min-w-[16rem]">
              Someone missing from a list isn’t an active member yet. Add their account above, or send them through <Link to="/admin/members" className="underline">Members</Link> (application,
              fee, orientation, Secretary’s approval — Article III).
            </p>
            <button type="submit" disabled={isLoading} className="mp-btn mp-btn--primary w-full sm:w-auto">Review the new term</button>
          </div>
          {error && <p role="alert" className="mp-alert mx-5 sm:mx-6 mb-5">{error}</p>}
        </form>
      ) : (
        <div className="ap-panel__body space-y-6" role="group" aria-label="Confirm the new term">
          <div className="grid gap-6 sm:grid-cols-2">
            <section aria-labelledby="term-in">
              <p id="term-in" className="mp-eyebrow" style={{ fontSize: '0.6875rem' }}>Taking office</p>
              <ul className="mt-3 space-y-3">
                {chosen.map((c) => (
                  <li key={c.seat.key} className="flex items-center gap-3">
                    <span className="ap-avatar" aria-hidden="true">{initials(byId.get(c.userId)?.name ?? '')}</span>
                    <span className="min-w-0">
                      <span className="block font-heading font-semibold text-[0.9375rem] truncate">{byId.get(c.userId)?.name}</span>
                      <span className="block mp-muted text-[0.8125rem]">{c.seat.label}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="term-out">
              <p id="term-out" className="mp-eyebrow" style={{ fontSize: '0.6875rem' }}>Stepping down</p>
              {steppingDown.length === 0 ? (
                <p className="mp-muted text-[0.9375rem] mt-3">No one. Everyone now in office continues.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {steppingDown.map((o) => (
                    <li key={o.id} className="flex items-center gap-3">
                      <span className="ap-avatar" aria-hidden="true" style={{ opacity: 0.7 }}>{initials(o.name)}</span>
                      <span className="min-w-0">
                        <span className="block font-heading font-semibold text-[0.9375rem] truncate">{o.name}</span>
                        <span className="block mp-muted text-[0.8125rem]">{seatName(o)} → regular member</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {vacant.length > 0 && (
            <p className="mp-muted text-[0.875rem]">
              Left vacant: {[...vacantOthers, ...(vacantPros.length ? [`PRO for ${vacantPros.join(', ')}`] : [])].join('; ')}. Fill them later with a mid-term change.
            </p>
          )}
          {iAmStepping && <p role="alert" className="mp-alert">You’re stepping down, so this console will stop working for you once your session refreshes.</p>}

          <div className="flex flex-wrap items-center gap-3 border-t pt-5" style={{ borderColor: 'rgb(20 39 24 / 0.1)' }}>
            <button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate()} className="mp-btn mp-btn--primary">
              {mutation.isPending ? 'Installing…' : 'Install term'}
            </button>
            <button type="button" disabled={mutation.isPending} onClick={() => setReviewing(false)} className="mp-btn mp-btn--ghost">Back to the ballot</button>
            <p className="mp-muted text-[0.8125rem] sm:ml-auto">Article VI §4 · recorded in the audit log</p>
          </div>
        </div>
      )}
    </Panel>
  );
}
