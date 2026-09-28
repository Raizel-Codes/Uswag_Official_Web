import { useAuth } from '@/hooks/useAuth';
import MemberManagementPage from './MemberManagementPage';
import FinanceOverviewPage from './FinanceOverviewPage';
import ContentManagerPage from './ContentManagerPage';
import ProcurementPage from './ProcurementPage';
import LockedState from '@/components/common/LockedState';

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
        <div className="min-h-screen bg-mist px-5 py-6 pb-24">
          <h1 className="font-heading text-[19px] font-bold text-forest leading-tight mb-0.5">Work</h1>
          <p className="text-[12px] text-gray-500 mb-4">Select an active module</p>
          <LockedState
            title="No Module Assigned"
            description="Your current role does not have a specific work module assigned."
            redirectLabel="Return to Dashboard"
          />
        </div>
      );
  }
}
