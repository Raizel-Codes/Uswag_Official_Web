import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Frontend gate for the /dev console only. The real check is requireDeveloper on the server, which
// re-reads the account from the database on every request.
export default function DeveloperRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/account/password" replace />;
  if (!user.isDeveloper) return <Navigate to="/" replace />;
  return <Outlet />;
}
