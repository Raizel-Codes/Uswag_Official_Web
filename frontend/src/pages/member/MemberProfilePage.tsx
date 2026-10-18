// Member portal — Profile (members only; officers keep ProfilePage via routes/PortalLayout).
// Same behavior as before — push toggle, navigation preference, log out — plus the member's
// real standing (the old page always said "Active Account").
import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useMyProfile } from '@/hooks/useMyProfile';
import { logout, updateNavPreference } from '@/services/authService';
import PageHeader from '@/components/portal/PageHeader';
import AccountSettings from '@/components/account/AccountSettings';
import StandingNote from '@/components/member/StandingNote';
import { STANDING_LABEL } from '@/components/member/standing';

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function MemberProfilePage() {
  const { user, clearSession, updateUser } = useAuthContext();
  const { data: profile } = useMyProfile();
  const push = usePushSubscription();
  const [navError, setNavError] = useState<string | null>(null);
  if (!user) return null;

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

  const rows: { label: string; value: string }[] = [
    { label: 'Email', value: user.email },
    { label: 'College / Dept.', value: profile?.collegeOrDept ?? user.collegeOrDept },
    ...(profile?.yearLevel ? [{ label: 'Year level', value: profile.yearLevel }] : []),
    ...(profile ? [{ label: 'Academic year', value: profile.academicYear.replace('-', '–') }] : []),
    ...(profile?.status === 'active' ? [{ label: 'Serial', value: profile.serialNumber }] : []),
    ...(profile ? [{ label: 'Member since', value: new Date(profile.joinedAt).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }) }] : []),
  ];

  return (
    <div className="mp-page space-y-10">
      <PageHeader eyebrow="Profile" title="Your account" />

      <section aria-label="You" className="mp-vault mp-vault--framed mp-vault--panel mp-on-dark p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center gap-5">
        <span className="mp-cameo w-20 h-20 grid place-items-center font-heading font-semibold text-[1.75rem] text-primary shrink-0" aria-hidden="true">
          {initials(user.name)}
        </span>
        <div className="relative min-w-0">
          <p className="font-heading font-semibold text-[1.5rem] leading-tight text-mist">{user.name}</p>
          <p className="mp-muted mt-1">{profile?.collegeOrDept ?? user.collegeOrDept}</p>
          {profile && <span className={`mp-standing mp-standing--${profile.status} mt-3`}>{STANDING_LABEL[profile.status]}</span>}
        </div>
      </section>

      {profile && profile.status !== 'active' && <StandingNote profile={profile} />}

      <section aria-labelledby="pf-account">
        <h2 id="pf-account" className="mp-h2">Account</h2>
        <dl className="mp-card mp-ledger mt-4 px-5 sm:px-6">
          {rows.map((r) => (
            <div key={r.label} className="py-3.5 flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-6 border-t first:border-t-0 border-[rgb(20_39_24/0.1)]">
              <dt className="mp-eyebrow sm:w-40 shrink-0" style={{ fontSize: '0.6875rem' }}>{r.label}</dt>
              <dd className={`text-[0.9375rem] break-all ${r.label === 'Serial' ? 'font-mono' : ''}`}>{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <AccountSettings />

      <section aria-labelledby="pf-prefs">
        <h2 id="pf-prefs" className="mp-h2">Preferences</h2>
        <div className="mp-card mt-4 px-5 sm:px-6">
          <div className="py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p id="pf-push" className="font-semibold">Push notifications</p>
              <p className="mp-muted text-[0.875rem]">Events, announcements and updates.</p>
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
          <div className="py-4 flex items-center gap-4 border-t border-[rgb(20_39_24/0.1)]">
            <div className="flex-1 min-w-0">
              <label htmlFor="pf-nav" className="font-semibold">Navigation</label>
              <p className="mp-muted text-[0.875rem]">Tab bar, side rail, or automatic by screen size.</p>
            </div>
            <select
              id="pf-nav"
              value={user.navStyle || 'auto'}
              onChange={(e) => changeNavStyle(e.target.value as 'auto' | 'bottom' | 'sidebar')}
              className="shrink-0 min-h-[44px] rounded-[3px] border border-[rgb(20_39_24/0.25)] bg-[rgb(231_239_228/0.6)] px-3 text-[0.875rem] focus:border-primary"
            >
              <option value="auto">Automatic</option>
              <option value="bottom">Tab bar</option>
              <option value="sidebar">Side rail</option>
            </select>
          </div>
          {navError && <p role="alert" className="mp-alert mb-4">{navError}</p>}
        </div>
      </section>

      <button type="button" onClick={handleLogout} className="mp-btn mp-btn--ghost w-full sm:w-auto !text-[var(--mp-danger-ink)] !border-[rgb(179_69_63/0.4)]">
        Log out
      </button>
    </div>
  );
}
