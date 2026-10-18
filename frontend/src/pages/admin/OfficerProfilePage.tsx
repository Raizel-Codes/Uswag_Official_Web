// Officer / Super Admin profile (/dashboard/profile for non-members — routes/PortalLayout).
// Shows what the position may and may not do, exactly as the officer-admin prototype's ROLES
// object defines each scope (CLAUDE.md "Roles & permissions") — a permission system should
// be legible, not silently absent — plus notifications, navigation preference and log out.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { logout, updateNavPreference } from '@/services/authService';
import type { OfficerPosition } from '@/types/auth.types';
import { isSuperAdminEquivalent } from '@/utils/roles';
import PageHeader from '@/components/portal/PageHeader';
import AccountSettings from '@/components/account/AccountSettings';
import Panel from '@/components/portal/Panel';
import { positionLabel } from '@/components/admin/positions';
import { initials } from '@/components/admin/format';

const PERMISSIONS: Partial<Record<OfficerPosition, { scope: string; items: { ok: boolean; text: string }[] }>> = {
  secretary: {
    scope: 'Members · Minutes · Announcements · Scan',
    items: [
      { ok: true, text: 'Approve or reject membership applications' },
      { ok: true, text: 'Maintain the member roster and records' },
      { ok: true, text: 'Publish meeting minutes' },
      { ok: true, text: 'Post announcements to members' },
      { ok: true, text: 'Scan QR cards for event attendance' },
      { ok: false, text: 'View or edit financial records' },
      { ok: false, text: 'Edit the bylaws or manage officer accounts' },
    ],
  },
  treasurer: {
    scope: 'Dues · Expenses · Financial reports · Scan',
    items: [
      { ok: true, text: 'Record and track membership dues' },
      { ok: true, text: 'Log organizational expenses' },
      { ok: true, text: 'Prepare semester financial statements' },
      { ok: true, text: 'Scan QR cards for event attendance' },
      { ok: false, text: 'Approve membership applications' },
      { ok: false, text: 'Edit the bylaws or manage officer accounts' },
      { ok: false, text: 'Post public announcements' },
    ],
  },
  auditor: {
    scope: 'Financial review · Attendance records · Audit',
    items: [
      { ok: true, text: 'View financial records and expense logs' },
      { ok: true, text: 'View attendance and scan history' },
      { ok: true, text: 'Prepare audit findings' },
      { ok: false, text: 'Record payments or edit financial entries' },
      { ok: false, text: 'Approve membership applications' },
      { ok: false, text: 'Edit the bylaws or manage officer accounts' },
      { ok: false, text: 'Scan QR cards at events' },
    ],
  },
  business_manager: {
    scope: 'Procurement · Suppliers · Scan',
    items: [
      { ok: true, text: 'Submit purchase requests for activities' },
      { ok: true, text: 'Manage supplier and vendor contacts' },
      { ok: true, text: 'Scan QR cards for event attendance' },
      { ok: false, text: 'Approve membership applications' },
      { ok: false, text: 'View or edit financial statements' },
      { ok: false, text: 'Edit the bylaws or manage officer accounts' },
      { ok: false, text: 'Post public announcements' },
    ],
  },
  pro: {
    scope: 'News · Social content · Scan (assigned events)',
    items: [
      { ok: true, text: 'Create and publish news posts' },
      { ok: true, text: 'Manage the Facebook Page sync' },
      { ok: true, text: 'Scan QR cards at events they’re assigned to' },
      { ok: false, text: 'Approve membership applications' },
      { ok: false, text: 'View or edit financial records' },
      { ok: false, text: 'Edit the bylaws or manage officer accounts' },
    ],
  },
};

export default function OfficerProfilePage() {
  const { user, clearSession, updateUser } = useAuthContext();
  const push = usePushSubscription();
  const [navError, setNavError] = useState<string | null>(null);
  if (!user) return null;

  const superAdmin = isSuperAdminEquivalent(user);
  const perms = user.officerPosition ? PERMISSIONS[user.officerPosition] : undefined;

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
    }
  }

  async function changeNavStyle(val: 'auto' | 'bottom' | 'sidebar') {
    setNavError(null);
    try {
      await updateNavPreference(val);
      updateUser({ navStyle: val });
    } catch {
      setNavError('Couldn’t save your navigation preference. Please try again.');
    }
  }

  return (
    <div className="mp-page space-y-10">
      <PageHeader eyebrow="Profile" title="Your account" />

      <section aria-label="You" className="mp-vault mp-vault--framed mp-vault--panel mp-on-dark p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center gap-5">
        <span className="mp-cameo w-20 h-20 grid place-items-center font-heading font-semibold text-[1.75rem] text-primary shrink-0" aria-hidden="true">
          {initials(user.name)}
        </span>
        <div className="relative min-w-0">
          <p className="font-heading font-semibold text-[1.5rem] leading-tight text-mist">{user.name}</p>
          <p className="mp-muted mt-1">{user.collegeOrDept}</p>
          <span className="mp-standing mp-standing--active mt-3">{user.isDeveloper ? 'Developer · view only' : positionLabel(user.officerPosition)}</span>
        </div>
      </section>

      <section aria-labelledby="pf-scope">
        <h2 id="pf-scope" className="mp-h2">Your scope</h2>
        {user.isDeveloper ? (
          <p className="mp-card p-5 mt-4 text-[0.9375rem]">
            You’re the site developer: an overseer, not an officer. You can see everything the Super Admin sees, plus the{' '}
            <Link to="/dev" className="mp-link">developer console</Link>, and you can change nothing (the server refuses every edit).
          </p>
        ) : superAdmin ? (
          <p className="mp-card p-5 mt-4 text-[0.9375rem]">
            As {user.officerPosition === 'vice_president' ? 'Vice President (acting for the President)' : 'President'}, you have the Super Admin scope:
            every module, officer accounts, bylaws amendments and the audit log (Article VI).
          </p>
        ) : perms ? (
          <div className="mp-card mt-4">
            <p className="px-5 sm:px-6 pt-5 mp-eyebrow">{perms.scope}</p>
            <ul className="ap-list mt-3">
              {perms.items.map((p) => (
                <li key={p.text} className="ap-row">
                  <span
                    className={`w-7 h-7 shrink-0 rounded-full grid place-items-center text-[0.8125rem] font-bold ${p.ok ? 'bg-[var(--color-success-bg)] text-[var(--mp-success-ink)]' : 'bg-[var(--color-danger-bg)] text-[var(--mp-danger-ink)]'}`}
                    aria-hidden="true"
                  >
                    {p.ok ? '✓' : '✕'}
                  </span>
                  <span className={`text-[0.9375rem] ${p.ok ? '' : 'mp-muted'}`}>
                    <span className="mp-sr-only">{p.ok ? 'Allowed: ' : 'Not allowed: '}</span>
                    {p.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="pf-account">
        <h2 id="pf-account" className="mp-h2">Account</h2>
        <dl className="mp-card mp-ledger mt-4 px-5 sm:px-6">
          {[
            { label: 'Email', value: user.email },
            { label: 'College / Dept.', value: user.collegeOrDept },
            { label: 'Position', value: user.isDeveloper ? 'Developer (not an officer)' : positionLabel(user.officerPosition) },
          ].map((r, i) => (
            <div key={r.label} className={`py-3.5 flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-6 ${i ? 'border-t border-[rgb(20_39_24/0.1)]' : ''}`}>
              <dt className="mp-eyebrow sm:w-40 shrink-0" style={{ fontSize: '0.6875rem' }}>{r.label}</dt>
              <dd className="text-[0.9375rem] break-all">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <AccountSettings />

      <Panel title="Preferences">
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <p id="pf-push" className="font-semibold">Push notifications</p>
            <p className="mp-muted text-[0.875rem]">Applications, events and announcements.</p>
            {push.error && <p role="alert" className="text-danger text-[0.8125rem] font-medium mt-1">{push.error}</p>}
          </div>
          {push.isSupported ? (
            <button
              type="button"
              role="switch"
              aria-checked={push.isSubscribed}
              aria-labelledby="pf-push"
              disabled={push.isLoading}
              onClick={() => (push.isSubscribed ? push.unsubscribe() : push.subscribe())}
              className={`relative w-12 h-7 rounded-full transition-colors shrink-0 disabled:opacity-50 ${push.isSubscribed ? 'bg-primary' : 'bg-[rgb(20_39_24/0.3)]'}`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${push.isSubscribed ? 'translate-x-5' : ''}`} />
            </button>
          ) : (
            <span className="mp-muted text-[0.8125rem] font-semibold text-right">{push.needsInstall ? 'Add USWAG to your Home Screen first' : 'Not supported on this browser'}</span>
          )}
        </div>
        <div className="flex items-center gap-4 mt-5 pt-5 border-t border-[rgb(20_39_24/0.1)]">
          <div className="flex-1 min-w-0">
            <label htmlFor="pf-nav" className="font-semibold">Navigation</label>
            <p className="mp-muted text-[0.875rem]">Tab bar, side rail, or automatic by screen size.</p>
          </div>
          <select id="pf-nav" value={user.navStyle || 'auto'} onChange={(e) => changeNavStyle(e.target.value as 'auto' | 'bottom' | 'sidebar')} className="ap-input !w-auto shrink-0">
            <option value="auto">Automatic</option>
            <option value="bottom">Tab bar</option>
            <option value="sidebar">Side rail</option>
          </select>
        </div>
        {navError && <p role="alert" className="mp-alert mt-4">{navError}</p>}
      </Panel>

      <button type="button" onClick={handleLogout} className="mp-btn mp-btn--ghost w-full sm:w-auto !text-[var(--mp-danger-ink)] !border-[rgb(179_69_63/0.4)]">
        Log out
      </button>
    </div>
  );
}
