import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import InstallPrompt from '@/components/pwa/InstallPrompt';

// Reference: prototype/member.html for mobile nav patterns,
// and the public sitemap in docs/plan_extracted.txt §6.1
export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* First focusable element: lets keyboard users jump past the header nav */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-3 focus:rounded-[3px] focus:bg-forest focus:text-mist focus:font-semibold focus:outline focus:outline-2 focus:outline-sage"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <Footer />
      <InstallPrompt />
    </div>
  );
}
