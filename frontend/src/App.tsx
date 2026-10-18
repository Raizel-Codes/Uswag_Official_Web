import AppRoutes from './routes/AppRoutes';
import MaintenanceGate from './components/maintenance/MaintenanceGate';

export default function App() {
  return (
    <MaintenanceGate>
      <AppRoutes />
    </MaintenanceGate>
  );
}
