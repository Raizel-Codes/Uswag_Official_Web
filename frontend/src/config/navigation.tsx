export interface NavItem {
  name: string;
  href: string;
  icon: (props: any) => JSX.Element;
  roles: string[];
  section?: string; // rail group heading (desktop)
  centre?: boolean; // tab bar: the raised centre tab
  /**
   * The destination stays visible but shows a lock (and the page explains why) when:
   * - 'inactiveMember': the member isn't ACTIVE (Article III — no card / event sign-ups)
   * - 'auditor': the officer is the Auditor (Article VI — no scan access)
   */
  lock?: 'inactiveMember' | 'auditor';
}

const CardIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
  </svg>
);

const LedgerIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 11l2 2 4-4" />
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 17h8" />
  </svg>
);

const HomeIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 12l9-9 9 9" />
    <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
  </svg>
);

const ScanIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const WorkIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

const UserIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

const UsersIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ShieldIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const CalendarIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const NewsIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 12a10 10 0 1 0-11.5 9.87v-6.98H7.9V12h2.6V9.8c0-2.56 1.52-3.98 3.86-3.98" />
  </svg>
);

const DocumentIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="9" y1="13" x2="15" y2="13" />
    <line x1="9" y1="17" x2="15" y2="17" />
  </svg>
);

const PesoIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7 21V4h6a4.5 4.5 0 0 1 0 9H7" />
    <path d="M4 8h14M4 11h14" />
  </svg>
);

export const NAV_ITEMS: NavItem[] = [
  // Member — components/member/MemberLayout.tsx. Five tabs, the card raised in the centre;
  // the card and attendance are separate destinations (docs/design/member-portal.md).
  { name: 'Home', href: '/dashboard', icon: HomeIcon, roles: ['member'] },
  { name: 'Events', href: '/dashboard/events', icon: CalendarIcon, roles: ['member'], lock: 'inactiveMember' },
  { name: 'Card', href: '/dashboard/qr', icon: CardIcon, roles: ['member'], centre: true, lock: 'inactiveMember' },
  { name: 'Attendance', href: '/dashboard/attendance', icon: LedgerIcon, roles: ['member'] },
  { name: 'Profile', href: '/dashboard/profile', icon: UserIcon, roles: ['member'] },

  // Officer Admin — components/admin/AdminLayout.tsx, mobile-first. Scan is the field tool,
  // raised like the member card; the Auditor sees it locked and explained (Article VI). QR is
  // every officer's own ID — for meetings/forums they conduct, not tied to a scanned event —
  // so it's available to every position including the Auditor (identity, not scan permission).
  { name: 'Home', href: '/admin', icon: HomeIcon, roles: ['officer_admin'] },
  { name: 'Work', href: '/admin/work', icon: WorkIcon, roles: ['officer_admin'] },
  { name: 'Scan', href: '/admin/scan', icon: ScanIcon, roles: ['officer_admin'], centre: true, lock: 'auditor' },
  { name: 'QR', href: '/admin/qr', icon: CardIcon, roles: ['officer_admin'] },
  { name: 'Profile', href: '/dashboard/profile', icon: UserIcon, roles: ['officer_admin'] },

  // Super Admin (+ VP) — desktop-first rail with sections. Finance and Audit Log are listed
  // too (they were routes without a way in); on phones everything past four goes in "More".
  { name: 'Dashboard', href: '/admin', icon: HomeIcon, roles: ['super_admin'], section: 'Overview' },
  { name: 'Members', href: '/admin/members', icon: UsersIcon, roles: ['super_admin'], section: 'Operations' },
  { name: 'Events', href: '/admin/events', icon: CalendarIcon, roles: ['super_admin'], section: 'Operations' },
  { name: 'Scan Console', href: '/admin/scan', icon: ScanIcon, roles: ['super_admin'], section: 'Operations' },
  { name: 'QR', href: '/admin/qr', icon: CardIcon, roles: ['super_admin'], section: 'Operations' },
  { name: 'Finance', href: '/admin/finance', icon: PesoIcon, roles: ['super_admin'], section: 'Oversight' },
  { name: 'Audit Log', href: '/admin/audit-log', icon: LedgerIcon, roles: ['super_admin'], section: 'Oversight' },
  { name: 'Officers', href: '/admin/officers', icon: ShieldIcon, roles: ['super_admin'], section: 'Governance' },
  { name: 'Content & News', href: '/admin/content', icon: NewsIcon, roles: ['super_admin'], section: 'Governance' },
  { name: 'Bylaws', href: '/admin/bylaws', icon: DocumentIcon, roles: ['super_admin'], section: 'Governance' },
  // Without this, the Super Admin has no nav entry at all for /dashboard/profile — the only
  // page with the log-out button — leaving no way to log out from the rail or the tab bar.
  { name: 'Profile', href: '/dashboard/profile', icon: UserIcon, roles: ['super_admin'], section: 'Account' },
];

// Vice President is Super-Admin-equivalent (see utils/roles.ts) — during the
// President's absence they get the full Super Admin sidebar, not the Officer
// Admin one, since they're expected to continue every admin/officer
// operation, not just their own position's slice.
export function getNavItems(user: { role: string; officerPosition?: string }): NavItem[] {
  const effectiveRole = user.officerPosition === 'vice_president' ? 'super_admin' : user.role;
  return NAV_ITEMS.filter(item => item.roles.includes(effectiveRole));
}
