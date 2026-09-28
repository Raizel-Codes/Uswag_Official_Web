import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout() {
  const { user } = useAuth();
  const navStyle = user?.navStyle || 'auto';

  let sidebarClass = '';
  let bottomNavClass = '';

  if (navStyle === 'sidebar') {
    sidebarClass = 'flex'; // always show
    bottomNavClass = 'hidden'; // always hide
  } else if (navStyle === 'bottom') {
    sidebarClass = 'hidden'; // always hide
    bottomNavClass = 'flex'; // always show
  } else {
    // auto
    sidebarClass = 'hidden md:flex';
    bottomNavClass = 'flex md:hidden';
  }

  return (
    <div className="min-h-screen flex bg-mist">
      <div className={sidebarClass}>
        <Sidebar />
      </div>
      <main className="flex-1 overflow-x-hidden">
        <Outlet />
      </main>
      <div className={bottomNavClass}>
        <BottomNav />
      </div>
    </div>
  );
}
