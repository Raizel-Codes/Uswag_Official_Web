import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getNavItems } from '@/config/navigation';
import Logo from '@/components/common/Logo';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const navItems = getNavItems(user);

  // Group by section (undefined section = ungrouped, rendered first with no heading)
  const sections: { name: string | null; items: typeof navItems }[] = [];
  for (const item of navItems) {
    const key = item.section ?? null;
    let group = sections.find((s) => s.name === key);
    if (!group) {
      group = { name: key, items: [] };
      sections.push(group);
    }
    group.items.push(item);
  }

  const initials = user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  const roleLabel = user.role === 'member' ? 'Member' : (user.officerPosition?.replace(/_/g, ' ') ?? 'Officer');

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="w-64 flex-col bg-forest text-white p-4 flex shrink-0 min-h-screen justify-between">
      <div>
        <div className="mb-6 flex items-center gap-2">
          <Logo variant="onDark" size={30} showWordmark={false} />
          <span className="font-heading font-bold text-xl">USWAG {user?.role === 'member' ? '' : 'Admin'}</span>
        </div>
        {sections.map((section) => (
          <div key={section.name ?? '_'} className="mb-1">
            {section.name && (
              <div className="px-3 pt-4 pb-1.5 text-[10.5px] font-bold uppercase tracking-wider text-white/35">
                {section.name}
              </div>
            )}
            <nav className="flex flex-col gap-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    end={item.href === '/admin' || item.href === '/dashboard'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-[13.5px] transition-colors ${
                        isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-[18px] h-[18px]" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-3 mt-4">
        <NavLink
          to="/dashboard/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-2 py-2 rounded-xl transition-colors ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`
          }
        >
          <div className="w-9 h-9 rounded-full bg-sage/30 text-sage flex items-center justify-center font-heading font-bold text-[12.5px] shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-[12.5px] font-bold truncate">{user.name}</div>
            <div className="text-[10.5px] text-white/50 capitalize truncate">{roleLabel}</div>
          </div>
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-[13px] text-white/60 hover:bg-white/5 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Log Out
        </button>
      </div>
    </aside>
  );
}
