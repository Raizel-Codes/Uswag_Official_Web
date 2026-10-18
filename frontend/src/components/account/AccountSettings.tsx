// "Edit your account" on both profile pages (member and officer): fix your own name, college /
// department and year level; correct your student ID; change your password. The email is the login
// and stays as it is. Everything here is the signed-in person's own account, checked again on the
// server (auth.controller.ts, member.controller.ts); the student ID and password changes ask for the
// current password. Written for both portals, so it uses plain Tailwind and mp-* classes only.

import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthContext } from '@/context/AuthContext';
import { useMyProfile } from '@/hooks/useMyProfile';
import { changePassword, updateProfile } from '@/services/authService';
import { changeStudentId } from '@/services/memberService';
import { COLLEGES, YEAR_LEVELS } from '@/config/colleges';
import { formatStudentId, studentIdProblem } from '@/utils/studentId';
import { apiError } from '@/utils/apiError';

const FIELD =
  'w-full min-h-[44px] rounded-[3px] border border-[rgb(20_39_24/0.25)] bg-[rgb(231_239_228/0.6)] px-3 text-[0.9375rem] focus:border-primary focus:outline-none focus:ring-2 focus:ring-[rgb(46_91_65/0.18)]';
const LABEL = 'block text-[0.8125rem] font-semibold mb-1';

type Notice = { kind: 'ok' | 'error'; text: string } | null;

function Feedback({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return notice.kind === 'error' ? (
    <p role="alert" className="mp-alert">{notice.text}</p>
  ) : (
    <p role="status" className="text-[0.875rem] font-semibold text-primary">{notice.text}</p>
  );
}

function DetailsForm() {
  const { user, updateUser } = useAuthContext();
  const { data: profile } = useMyProfile();
  const queryClient = useQueryClient();
  const [name, setName] = useState(user?.name ?? '');
  const [college, setCollege] = useState<string>(COLLEGES.includes((user?.collegeOrDept ?? '') as (typeof COLLEGES)[number]) ? user!.collegeOrDept : '');
  const [year, setYear] = useState<string | null>(null); // null = untouched, follow the profile
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const yearValue = year ?? profile?.yearLevel ?? '';
  const isPro = user?.officerPosition === 'pro';

  async function submit(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    if (name.trim().length < 2) return setNotice({ kind: 'error', text: 'Enter your full name.' });
    if (!college) return setNotice({ kind: 'error', text: 'Choose your college or department.' });
    setBusy(true);
    try {
      const updated = await updateProfile({ name: name.trim(), collegeOrDept: college, yearLevel: yearValue || null });
      updateUser({ name: updated.name, collegeOrDept: updated.collegeOrDept });
      for (const key of [['member', 'profile'], ['members'], ['officers'], ['officer-nominees'], ['publicOfficers']]) queryClient.invalidateQueries({ queryKey: key });
      setNotice({ kind: 'ok', text: 'Saved.' });
    } catch (err) {
      setNotice({ kind: 'error', text: apiError(err, 'Couldn’t save your details. Please try again.') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <h3 className="mp-h3">Your details</h3>
      <div>
        <label htmlFor="acct-name" className={LABEL}>Full name</label>
        <input id="acct-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={FIELD} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="acct-college" className={LABEL}>College / Department</label>
          <select id="acct-college" value={college} onChange={(e) => setCollege(e.target.value)} className={FIELD}>
            <option value="">Select…</option>
            {COLLEGES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {isPro && <p className="mp-muted text-[0.8125rem] mt-1">You’re your college’s PRO. You can only move to a college that has no PRO yet.</p>}
        </div>
        <div>
          <label htmlFor="acct-year" className={LABEL}>Year level <span className="font-normal mp-muted">(optional)</span></label>
          <select id="acct-year" value={yearValue} onChange={(e) => setYear(e.target.value)} className={FIELD}>
            <option value="">Not set</option>
            {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <Feedback notice={notice} />
      <button type="submit" disabled={busy} className="mp-btn mp-btn--primary w-full sm:w-auto">{busy ? 'Saving…' : 'Save details'}</button>
    </form>
  );
}

function StudentIdForm() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    const problem = studentIdProblem(studentId);
    if (problem) return setNotice({ kind: 'error', text: problem });
    if (!password) return setNotice({ kind: 'error', text: 'Enter your password to confirm.' });
    setBusy(true);
    try {
      const { changed } = await changeStudentId(studentId, password);
      setStudentId('');
      setPassword('');
      setNotice({ kind: 'ok', text: changed ? 'Your student ID was updated.' : 'That is already the student ID on your account.' });
    } catch (err) {
      setNotice({ kind: 'error', text: apiError(err, 'Couldn’t update your student ID. Please try again.') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div>
        <h3 className="mp-h3">Student ID</h3>
        <p className="mp-muted text-[0.875rem] mt-1">
          Your ID is stored securely and isn’t shown again. If it was entered wrong when your account was made, type the correct one here.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="acct-sid" className={LABEL}>Correct student ID</label>
          <input
            id="acct-sid"
            value={studentId}
            onChange={(e) => setStudentId(formatStudentId(e.target.value))}
            inputMode="numeric"
            autoComplete="off"
            placeholder="23-00877"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="acct-sid-pw" className={LABEL}>Your password</label>
          <input id="acct-sid-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className={FIELD} />
        </div>
      </div>
      <Feedback notice={notice} />
      <button type="submit" disabled={busy} className="mp-btn mp-btn--primary w-full sm:w-auto">{busy ? 'Updating…' : 'Update student ID'}</button>
    </form>
  );
}

export function PasswordForm({ onChanged }: { onChanged?: () => void }) {
  const { setSession } = useAuthContext();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setNotice(null);
    if (!current) return setNotice({ kind: 'error', text: 'Enter your current password.' });
    if (next.length < 8) return setNotice({ kind: 'error', text: 'The new password needs at least 8 characters.' });
    if (next !== confirm) return setNotice({ kind: 'error', text: 'The two new passwords don’t match.' });
    setBusy(true);
    try {
      // Other devices are signed out; this fresh session keeps this one in.
      const session = await changePassword(current, next);
      setSession(session.user, session.accessToken, session.refreshToken);
      setCurrent('');
      setNext('');
      setConfirm('');
      setNotice({ kind: 'ok', text: 'Password changed. Any other device you were signed in on has been signed out.' });
      onChanged?.();
    } catch (err) {
      setNotice({ kind: 'error', text: apiError(err, 'Couldn’t change your password. Please try again.') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <h3 className="mp-h3">Password</h3>
      <div>
        <label htmlFor="acct-pw-cur" className={LABEL}>Current password</label>
        <input id="acct-pw-cur" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" className={FIELD} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="acct-pw-new" className={LABEL}>New password</label>
          <input id="acct-pw-new" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" className={FIELD} />
          <p className="mp-muted text-[0.8125rem] mt-1">At least 8 characters.</p>
        </div>
        <div>
          <label htmlFor="acct-pw-confirm" className={LABEL}>Repeat the new password</label>
          <input id="acct-pw-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className={FIELD} />
        </div>
      </div>
      <Feedback notice={notice} />
      <button type="submit" disabled={busy} className="mp-btn mp-btn--primary w-full sm:w-auto">{busy ? 'Changing…' : 'Change password'}</button>
    </form>
  );
}

export default function AccountSettings() {
  const { user } = useAuthContext();
  const { data: profile } = useMyProfile();
  // The developer's account is view-only: there are no details of its own to edit, only the password.
  const developer = user?.isDeveloper === true;
  // Officer accounts made before memberships were recorded have no student ID to correct.
  return (
    <section aria-labelledby="pf-edit">
      <h2 id="pf-edit" className="mp-h2">Edit your account</h2>
      <div className="mp-card mt-4 px-5 sm:px-6 py-2 divide-y divide-[rgb(20_39_24/0.1)] [&>form]:py-5">
        {!developer && <DetailsForm />}
        {!developer && profile && <StudentIdForm />}
        <PasswordForm />
      </div>
      <p className="mp-muted text-[0.8125rem] mt-3">Your email is your login, so it can’t be changed here.</p>
    </section>
  );
}
