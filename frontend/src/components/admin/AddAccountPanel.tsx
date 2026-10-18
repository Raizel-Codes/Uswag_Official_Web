// Super Admin: add the account of someone who is already a member in good standing (the incoming
// officers, the President included) without sending them through the public application. They become
// an active member for this academic year; giving them a position is the next step (Install the term).
// The student ID may be wrong here: the person corrects it from their own profile. Because this skips
// the application, fee and orientation, it is recorded in the audit log as "account.create".

import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAccount, type NewAccountInput } from '@/services/adminService';
import { COLLEGES, YEAR_LEVELS } from '@/config/colleges';
import { formatStudentId, studentIdProblem } from '@/utils/studentId';
import Panel from '@/components/portal/Panel';
import SetupLinkBox from '@/components/admin/SetupLinkBox';
import { apiError } from '@/components/admin/format';

const empty: NewAccountInput = { name: '', email: '', studentId: '', collegeOrDept: '', yearLevel: '' };

export default function AddAccountPanel({ onDone }: { onDone: (msg: string) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<NewAccountInput>(empty);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<NewAccountInput>) => setForm((f) => ({ ...f, ...patch }));

  const mutation = useMutation({
    mutationFn: () => createAccount({ ...form, name: form.name.trim(), email: form.email.trim(), yearLevel: form.yearLevel || undefined }),
    onError: (err) => setError(apiError(err, 'Could not create the account. Please try again.')),
    onSuccess: (created) => {
      for (const key of ['officers', 'officer-nominees', 'members']) queryClient.invalidateQueries({ queryKey: [key] });
      onDone(`${created.name}’s account was created`);
    },
  });
  const created = mutation.data;

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.name.trim().length < 2) return setError('Enter their full name.');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Enter a valid email address.');
    const idProblem = studentIdProblem(form.studentId);
    if (idProblem) return setError(idProblem);
    if (!form.collegeOrDept) return setError('Choose their college or department.');
    mutation.mutate();
  }

  function another() {
    mutation.reset();
    setForm(empty);
  }

  return (
    <Panel title="Add an officer account" id="add-account">
      {created ? (
        <div className="space-y-5" role="status">
          <p className="text-[0.9375rem]">
            <strong className="font-semibold">{created.name}</strong> ({created.email}) is now an active member. Give them the link below so they can choose a password, then seat them in
            <a href="#install-term" className="underline mx-1">Install the term</a>
            to give them a position.
          </p>
          <SetupLinkBox url={created.url} minutes={created.expiresInMinutes} />
          <button type="button" onClick={another} className="mp-btn mp-btn--ghost w-full sm:w-auto">Add another account</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <p className="mp-muted text-[0.9375rem] leading-relaxed">
            For officers who are already in the organization. The account is active right away, with no application. After this, seat them in a position below.
          </p>
          <div>
            <label htmlFor="add-name" className="ap-label">Full name</label>
            <input id="add-name" value={form.name} onChange={(e) => set({ name: e.target.value })} autoComplete="off" className="ap-input" />
          </div>
          <div>
            <label htmlFor="add-email" className="ap-label">Email</label>
            <input id="add-email" type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} autoComplete="off" className="ap-input" />
            <p className="ap-hint">This is their login. It can’t be changed later, so check the spelling.</p>
          </div>
          <div>
            <label htmlFor="add-sid" className="ap-label">Student ID</label>
            <input id="add-sid" value={form.studentId} onChange={(e) => set({ studentId: formatStudentId(e.target.value) })} inputMode="numeric" autoComplete="off" placeholder="23-00877" className="ap-input" />
            <p className="ap-hint">If it’s wrong, they can correct it from their own profile.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="add-college" className="ap-label">College / Department</label>
              <select id="add-college" value={form.collegeOrDept} onChange={(e) => set({ collegeOrDept: e.target.value })} className="ap-input">
                <option value="">Select…</option>
                {COLLEGES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="add-year" className="ap-label">Year level <span className="font-normal mp-muted">(optional)</span></label>
              <select id="add-year" value={form.yearLevel} onChange={(e) => set({ yearLevel: e.target.value })} className="ap-input">
                <option value="">Not set</option>
                {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          {error && <p role="alert" className="mp-alert">{error}</p>}
          <button type="submit" disabled={mutation.isPending} className="mp-btn mp-btn--primary w-full sm:w-auto">
            {mutation.isPending ? 'Creating…' : 'Create account'}
          </button>
          <p className="mp-muted text-[0.8125rem]">Recorded in the audit log, since it skips the application.</p>
        </form>
      )}
    </Panel>
  );
}
