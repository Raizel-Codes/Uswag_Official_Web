import { useAuth } from '@/hooks/useAuth';
import MemberManagementPage from './MemberManagementPage';
import FinanceOverviewPage from './FinanceOverviewPage';
import ContentManagerPage from './ContentManagerPage';
import ProcurementPage from './ProcurementPage';
import LockedState from '@/components/common/LockedState';
import PageHeader from '@/components/portal/PageHeader';

// /admin/work — each officer position's own module (Article VI §2).
export default function AdminWorkPage() {
  const { user } = useAuth();
  if (!user) return null;

  switch (user.officerPosition) {
    case 'secretary':
      return <MemberManagementPage />;
    case 'treasurer':
    case 'auditor':
      return <FinanceOverviewPage />;
    case 'business_manager':
      return <ProcurementPage />;
    case 'pro':
      return <ContentManagerPage />;
    default:
      return (
        <div className="mp-page space-y-8">
          <PageHeader eyebrow="Work" title="No module assigned" />
          <LockedState
            title="No work module for this position"
            description="Your position doesn't have its own work module in the console."
            redirectLabel="Back to Home"
            to="/admin"
          />
        </div>
      );
  }
}
