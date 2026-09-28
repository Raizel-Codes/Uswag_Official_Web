import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getNavItems } from '@/config/navigation';

export default function BottomNav() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const navItems = getNavItems(user).filter(item => !item.hideOnMobile);

  return (
    <div className="fixed bottom-5 left-5 right-5 bg-white border border-gray-100 flex justify-around items-center px-2 py-2 rounded-[24px] z-15 shadow-[0_8px_30px_rgba(20,39,24,0.08)] md:hidden lg:hidden" style={{ zIndex: 15 }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/admin' || item.href === '/dashboard'}
            className="flex flex-col items-center gap-1 py-1.5 flex-1 text-[10px] font-semibold"
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex items-center justify-center w-10 h-8 rounded-full transition-colors ${
                    isActive ? 'bg-primary/10' : 'bg-transparent'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'stroke-[2.4] stroke-primary' : 'stroke-2 stroke-gray-400'
                    }`}
                  />
                </span>
                <span className={`transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                  {item.name}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );
}
