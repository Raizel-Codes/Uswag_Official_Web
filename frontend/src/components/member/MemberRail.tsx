import { NavLink } from 'react-router-dom';
import Logo from '@/components/common/Logo';
import type { NavItem } from '@/config/navigation';
import type { MemberProfile } from '@/types/member.types';
import type { AuthUser } from '@/types/auth.types';
import { STANDING_LABEL } from './standing';
import { LockGlyph } from './MemberTabBar';

function initials(name: string) {
  return name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

// Desktop navigation: a Deep Forest "vault" column (the public site's showcase surface),
// small-caps destinations, and the member's own plate at the foot.
export default function MemberRail({
  className = '',
  items,
  locked,
  user,
  profile,
}: {
  className?: string;
  items: NavItem[];
  locked: boolean;
  user: AuthUser;
  profile?: MemberProfile;
}) {
  return (
    <aside className={`mp-rail mp-vault mp-on-dark ${className}`} aria-label="Member portal">
      <Logo variant="onDark" size={34} wordmarkFont="heading" />
      <p className="mp-eyebrow mt-3" style={{ color: 'var(--color-sage)' }}>Member portal</p>

      <nav aria-label="Member" className="mt-9 flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isLocked = locked && item.activeOnly;
          return (
            <NavLink key={item.href} to={item.href} end={item.href === '/dashboard'} className="mp-rail__link">
              <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
              {item.name}
              {isLocked && (
                <>
                  <LockGlyph className="mp-rail__lock w-3.5 h-3.5" />
                  <span className="mp-sr-only"> (locked until your membership is active)</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-[rgb(152_203_176/0.25)] flex items-center gap-3">
        <span className="mp-seal w-10 h-10 font-heading text-[0.875rem] font-semibold" aria-hidden="true">
          {initials(user.name)}
        </span>
        <div className="min-w-0">
          <p className="text-[0.875rem] font-semibold text-mist truncate">{user.name}</p>
          <p className="text-[0.75rem] mp-muted truncate">{profile ? STANDING_LABEL[profile.status] : user.collegeOrDept}</p>
        </div>
      </div>
    </aside>
  );
}
