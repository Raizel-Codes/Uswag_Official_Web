// Shown instead of everything else while an account still has a handed-over (temporary) password: the
// site developer's first login, for now. The server refuses every other request until the password is
// changed too (auth.middleware.ts), so this isn't only a screen to skip. Not under ProtectedRoute: that
// guard is what sends people here.

import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { PasswordForm } from '@/components/account/AccountSettings';
import '@/styles/member.css';

export default function ChangePasswordRequiredPage() {
  const { user, isLoading } = useAuthContext();
  const navigate = useNavigate();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.mustChangePassword) return <Navigate to={user.isDeveloper ? '/dev' : '/'} replace />;

  return (
    <div className="mp grid place-items-center px-4 py-10">
      <main className="w-full max-w-[34rem]">
        <p className="mp-eyebrow">Before you continue</p>
        <h1 className="mp-h1 mt-1">Choose your own password</h1>
        <p className="mp-muted mt-3 text-[0.9375rem]">
          You signed in with a temporary password. Enter it below as your current password, then pick a new one that only you know. Nothing else opens until you do.
        </p>
        <div className="mp-card mt-6 px-5 sm:px-6 py-5">
          <PasswordForm onChanged={() => navigate(user.isDeveloper ? '/dev' : '/', { replace: true })} />
        </div>
      </main>
    </div>
  );
}
