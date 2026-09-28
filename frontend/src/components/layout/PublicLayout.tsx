import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import InstallPrompt from '@/components/pwa/InstallPrompt';

// Reference: prototype/member.html for mobile nav patterns,
// and the public sitemap in docs/plan_extracted.txt §6.1
export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <InstallPrompt />
    </div>
  );
}
