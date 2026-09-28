import { useAuthContext } from '@/context/AuthContext';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { logout } from '@/services/authService';
import type { OfficerPosition } from '@/types/auth.types';

// Scope + permissions checklist per officer position — mirrors the ROLES
// object in prototype/officer-admin.html exactly (the canonical scope
// definition per claude.md "Roles & permissions"). President/Vice President
// are Super Admin scope (everything), so they're intentionally left out —
// there's no boundary to disclose.
const OFFICER_PERMISSIONS: Partial<Record<OfficerPosition, { scope: string; items: { ok: boolean; text: string }[] }>> = {
  secretary: {
    scope: 'Scope: Members · Minutes · Announcements · Scan',
    items: [
      { ok: true, text: 'Approve or reject membership applications' },
      { ok: true, text: 'Maintain member roster & records' },
      { ok: true, text: 'Draft and publish meeting minutes' },
      { ok: true, text: 'Post announcements to members' },
      { ok: true, text: 'Scan QR for event attendance' },
      { ok: false, text: 'View or edit financial records' },
      { ok: false, text: 'Edit bylaws or manage officer accounts' },
    ],
  },
  treasurer: {
    scope: 'Scope: Dues · Expenses · Financial Reports · Scan',
    items: [
      { ok: true, text: 'Record and track membership dues' },
      { ok: true, text: 'Log organizational expenses' },
      { ok: true, text: 'Prepare semester financial statements' },
      { ok: true, text: 'Scan QR for event attendance' },
      { ok: false, text: 'Approve membership applications' },
      { ok: false, text: 'Edit bylaws or manage officer accounts' },
      { ok: false, text: 'Post public announcements' },
    ],
  },
  auditor: {
    scope: 'Scope: Financial Review · Attendance Records · Audit Log',
    items: [
      { ok: true, text: 'View financial records and expense logs' },
      { ok: true, text: 'View attendance & scan history records' },
      { ok: true, text: 'Prepare and submit audit reports' },
      { ok: false, text: 'Record payments or edit financial entries' },
      { ok: false, text: 'Approve membership applications' },
      { ok: false, text: 'Edit bylaws or manage officer accounts' },
      { ok: false, text: 'Scan QR at events' },
    ],
  },
  business_manager: {
    scope: 'Scope: Procurement · Supplier Coordination · Scan',
    items: [
      { ok: true, text: 'Submit purchase requests for org activities' },
      { ok: true, text: 'Manage supplier/vendor contacts' },
      { ok: true, text: 'Scan QR for event attendance' },
      { ok: false, text: 'Approve membership applications' },
      { ok: false, text: 'View or edit financial statements' },
      { ok: false, text: 'Edit bylaws or manage officer accounts' },
      { ok: false, text: 'Post public announcements' },
    ],
  },
  pro: {
    scope: 'Scope: News · Social Content · Scan (assigned events)',
    items: [
      { ok: true, text: 'Create and publish news posts' },
      { ok: true, text: 'Manage Facebook sync & manual overrides' },
      { ok: true, text: 'Scan QR at events they\'re assigned to' },
      { ok: false, text: 'Approve membership applications' },
      { ok: false, text: 'View or edit financial records' },
      { ok: false, text: 'Edit bylaws or manage officer accounts' },
    ],
  },
};

export default function ProfilePage() {
  const { user, clearSession, updateUser } = useAuthContext();
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushSubscription();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      clearSession();
      // Router handles redirecting to / since user is null
    }
  };

  const togglePush = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (!user) return null;

  const permissions = user.officerPosition ? OFFICER_PERMISSIONS[user.officerPosition] : undefined;

  return (
    <div className="px-5 py-6 max-w-md mx-auto md:max-w-xl pb-32">
      
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-sage to-primary text-white rounded-[28px] shadow-lg flex flex-col items-center justify-center mb-4">
          <div className="font-heading font-extrabold text-[32px]">{user.name.split(' ').map(n => n[0]).join('').substring(0,2)}</div>
        </div>
        <h1 className="text-2xl font-heading font-bold text-forest">{user.name}</h1>
        <p className="text-[14.5px] text-gray-500 mt-1">{user.collegeOrDept} · {user.role === 'member' ? 'Member' : user.officerPosition?.replace('_', ' ')}</p>
        {permissions && (
          <p className="text-[12px] text-primary font-semibold mt-2">{permissions.scope}</p>
        )}
      </div>

      {permissions && (
        <div className="mb-6">
          <h3 className="font-heading font-bold text-[15px] text-forest mb-3">Your Permissions</h3>
          <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
            {permissions.items.map((item, idx) => (
              <div
                key={idx}
                className={`flex gap-3 items-start p-4 ${idx !== permissions.items.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.ok ? 'bg-successBg text-success' : 'bg-red-50 text-red-400'}`}>
                  {item.ok ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </div>
                <p className={`text-[13.5px] leading-snug ${item.ok ? 'text-forest' : 'text-gray-400'}`}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-heading font-bold text-[15px] text-forest mb-3">Account Information</h3>
        <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex gap-4 items-center p-4 border-b border-gray-50">
            <div className="w-10 h-10 rounded-xl bg-mist flex items-center justify-center shrink-0 text-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <div className="text-[12px] font-bold text-forest uppercase tracking-wider">Email Address</div>
              <div className="text-[14px] text-gray-600">{user.email}</div>
            </div>
          </div>
          <div className="flex gap-4 items-center p-4">
            <div className="w-10 h-10 rounded-xl bg-mist flex items-center justify-center shrink-0 text-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            </div>
            <div>
              <div className="text-[12px] font-bold text-forest uppercase tracking-wider">Membership Status</div>
              <div className="text-[14px] text-gray-600">Active Account</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-heading font-bold text-[15px] text-forest mb-3">Preferences</h3>
        <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden p-4">
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-xl bg-mist flex items-center justify-center shrink-0 text-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
            <div className="flex-1">
              <div className="text-[13.5px] font-bold text-forest">Push Notifications</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Events, announcements & updates</div>
            </div>
            <div className="shrink-0">
              {isSupported ? (
                <button 
                  onClick={togglePush}
                  disabled={isLoading}
                  className={`relative w-12 h-7 rounded-full transition-colors ${isSubscribed ? 'bg-primary' : 'bg-gray-300'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${isSubscribed ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </button>
              ) : (
                <span className="text-[10px] text-gray-400 font-bold uppercase">Unsupported</span>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-50 my-4" />

          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-xl bg-mist flex items-center justify-center shrink-0 text-primary">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </div>
            <div className="flex-1">
              <div className="text-[13.5px] font-bold text-forest">Navigation Style</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Choose your menu layout</div>
            </div>
            <div className="shrink-0">
              <select 
                value={user.navStyle || 'auto'}
                onChange={async (e) => {
                  const val = e.target.value as 'auto' | 'bottom' | 'sidebar';
                  const { updateNavPreference } = await import('@/services/authService');
                  try {
                    await updateNavPreference(val);
                    updateUser({ navStyle: val });
                  } catch (err) {
                    console.error('Failed to update nav style', err);
                  }
                }}
                className="bg-gray-50 border border-gray-200 text-forest text-xs rounded-lg focus:ring-primary focus:border-primary block w-full p-2"
              >
                <option value="auto">Auto</option>
                <option value="bottom">Bottom Nav</option>
                <option value="sidebar">Sidebar</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full py-4 rounded-2xl border-[1.5px] border-red-100 bg-white text-red-500 font-bold text-[14px] hover:bg-red-50 transition-colors"
      >
        Log Out
      </button>

    </div>
  );
}
