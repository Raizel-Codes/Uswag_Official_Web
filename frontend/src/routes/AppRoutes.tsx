import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from '@/components/layout/PublicLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import PortalLayout, { PortalProfilePage } from './PortalLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Every page below is lazy-loaded so Vite splits the bundle into separate
// chunks per page instead of one ~940KB bundle everyone downloads on first
// load. In practice this means a first-time public visitor only fetches
// the public pages they actually navigate to — the entire admin console
// (Super Admin desktop views, all five officer dashboards, scan console,
// etc.) and the member portal never get downloaded unless that person
// actually logs in and reaches those routes.

// Public pages
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const AdvocaciesPage = lazy(() => import('@/pages/public/AdvocaciesPage'));
const OfficersPage = lazy(() => import('@/pages/public/OfficersPage'));
const EventsPage = lazy(() => import('@/pages/public/EventsPage'));
const NewsPage = lazy(() => import('@/pages/public/NewsPage'));
const JoinUsPage = lazy(() => import('@/pages/public/JoinUsPage'));
const ApplicationPage = lazy(() => import('@/pages/public/ApplicationPage'));
const BylawsPage = lazy(() => import('@/pages/public/BylawsPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));
const LoginPage = lazy(() => import('@/pages/public/LoginPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/public/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/public/ResetPasswordPage'));

// Member pages
const MemberDashboardPage = lazy(() => import('@/pages/member/MemberDashboardPage'));
const MyQRPage = lazy(() => import('@/pages/member/MyQRPage'));
const MyAttendancePage = lazy(() => import('@/pages/member/MyAttendancePage'));
const MemberEventsPage = lazy(() => import('@/pages/member/MemberEventsPage'));

// Admin pages
const AdminHomePage = lazy(() => import('@/pages/admin/AdminHomePage'));
const AdminWorkPage = lazy(() => import('@/pages/admin/AdminWorkPage'));
const AdminMembersHomePage = lazy(() => import('@/pages/admin/AdminMembersHomePage'));
const EventManagementPage = lazy(() => import('@/pages/admin/EventManagementPage'));
const ScanConsolePage = lazy(() => import('@/pages/admin/ScanConsolePage'));
const OfficerQrPage = lazy(() => import('@/pages/admin/OfficerQrPage'));
const ContentManagerPage = lazy(() => import('@/pages/admin/ContentManagerPage'));
const OfficerRosterPage = lazy(() => import('@/pages/admin/OfficerRosterPage'));
const BylawsAmendmentsPage = lazy(() => import('@/pages/admin/BylawsAmendmentsPage'));
const FinanceOverviewPage = lazy(() => import('@/pages/admin/FinanceOverviewPage'));
const AuditLogPage = lazy(() => import('@/pages/admin/AuditLogPage'));

// Full-page fallback while a route chunk downloads (a page, or a portal shell —
// PortalLayout lazy-loads the member portal / admin console on first visit).
function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/advocacies" element={<AdvocaciesPage />} />
          <Route path="/officers" element={<OfficersPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/join" element={<JoinUsPage />} />
          <Route path="/apply" element={<ApplicationPage />} />
          <Route path="/bylaws" element={<BylawsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Member portal — any authenticated user. PortalLayout gives members the member
            portal and officers (who reach /dashboard/profile) the admin console shell. */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PortalLayout />}>
            <Route path="/dashboard" element={<MemberDashboardPage />} />
            <Route path="/dashboard/qr" element={<MyQRPage />} />
            <Route path="/dashboard/attendance" element={<MyAttendancePage />} />
            <Route path="/dashboard/events" element={<MemberEventsPage />} />
            <Route path="/dashboard/profile" element={<PortalProfilePage />} />
          </Route>
        </Route>

        {/* Admin — Super Admin + Officer Admin, scoped further inside each page */}
        <Route element={<RoleRoute allow={['super_admin', 'officer_admin']} />}>
          <Route element={<PortalLayout />}>
            <Route path="/admin" element={<AdminHomePage />} />
            <Route path="/admin/work" element={<AdminWorkPage />} />
            <Route path="/admin/members" element={<AdminMembersHomePage />} />
            <Route path="/admin/events" element={<EventManagementPage />} />
            <Route path="/admin/scan" element={<ScanConsolePage />} />
            <Route path="/admin/qr" element={<OfficerQrPage />} />
            <Route path="/admin/content" element={<ContentManagerPage />} />

            {/* Super Admin only */}
            <Route element={<RoleRoute allow={['super_admin']} />}>
              <Route path="/admin/officers" element={<OfficerRosterPage />} />
              <Route path="/admin/bylaws" element={<BylawsAmendmentsPage />} />
              <Route path="/admin/audit-log" element={<AuditLogPage />} />
            </Route>

            {/* Super Admin + Treasurer/Auditor (finer check happens inside the page) */}
            <Route path="/admin/finance" element={<FinanceOverviewPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
