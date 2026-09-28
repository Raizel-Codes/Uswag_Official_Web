// Dispatches the shared /admin route to the right dashboard per role.
// Super Admin (President/VP) gets the desktop-first console dashboard;
// Officer Admin (Secretary/Treasurer/Auditor/Business Manager/PRO) gets
// the mobile-first per-position dashboard. See claude.md: "Member and
// Officer Admin are mobile-first; Super Admin is desktop-first."
import { useAuth } from "@/hooks/useAuth";
import SuperAdminDashboardPage from "./SuperAdminDashboardPage";
import AdminDashboardPage from "./AdminDashboardPage";
import { isSuperAdminEquivalent } from "@/utils/roles";

export default function AdminHomePage() {
  const { user } = useAuth();

  if (isSuperAdminEquivalent(user)) {
    return <SuperAdminDashboardPage />;
  }

  return <AdminDashboardPage />;
}
