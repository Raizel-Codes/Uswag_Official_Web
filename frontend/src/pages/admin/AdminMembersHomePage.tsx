// Dispatches /admin/members to the right layout per role — Super Admin gets
// the desktop-first roster table (prototype/super-admin.html #view-members),
// Secretary (Officer Admin) gets the mobile-first approve/reject workflow.
// See claude.md: "Member and Officer Admin are mobile-first; Super Admin is
// desktop-first."
import { useAuth } from "@/hooks/useAuth";
import SuperAdminMembersPage from "./SuperAdminMembersPage";
import MemberManagementPage from "./MemberManagementPage";
import { isSuperAdminEquivalent } from "@/utils/roles";

export default function AdminMembersHomePage() {
  const { user } = useAuth();

  if (isSuperAdminEquivalent(user)) {
    return <SuperAdminMembersPage />;
  }

  return <MemberManagementPage />;
}
