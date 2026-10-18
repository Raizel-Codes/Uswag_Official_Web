import AppRoutes from './routes/AppRoutes';
import MaintenanceGate from './components/maintenance/MaintenanceGate';
import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  return (
    <MaintenanceGate>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </MaintenanceGate>
  );
}
