import { useAuthContext } from '@/context/AuthContext';
import * as authService from '@/services/authService';
import type { UserRole } from '@/types/auth.types';

export function useAuth() {
  const { user, isLoading, setSession, clearSession } = useAuthContext();

  async function login(email: string, password: string) {
    const session = await authService.login(email, password);
    setSession(session.user, session.accessToken, session.refreshToken);
    return session;
  }

  async function logout() {
    try {
      await authService.logout();
    } finally {
      // Always clear client-side session even if the server call fails
      clearSession();
    }
  }

  function hasRole(...roles: UserRole[]) {
    return !!user && roles.includes(user.role);
  }

  return { user, isLoading, login, logout, hasRole };
}
