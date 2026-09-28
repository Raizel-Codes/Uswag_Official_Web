import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  // Wait for localStorage rehydration before deciding whether to redirect.
  // Without this guard a hard refresh would always bounce to /login.
  if (isLoading) return null;

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
