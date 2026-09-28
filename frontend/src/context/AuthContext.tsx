import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser } from '@/types/auth.types';

// localStorage keys — exported so api.ts interceptor can read the token
// without creating a circular dependency on the context.
export const ACCESS_TOKEN_KEY = 'uswag_access_token';
export const REFRESH_TOKEN_KEY = 'uswag_refresh_token';
// Exported so api.ts's response interceptor can persist the refreshed user
// alongside the rotated tokens on a silent token refresh (see refreshAccessToken
// there) without creating a circular dependency on this context.
export const USER_KEY = 'uswag_user';

interface AuthContextValue {
  user: AuthUser | null;
  /** true while we're rehydrating from localStorage on first load */
  isLoading: boolean;
  setSession: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate user from localStorage on first mount so a page refresh
  // doesn't immediately redirect to /login.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) setUser(JSON.parse(stored) as AuthUser);
    } catch {
      localStorage.removeItem(USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function setSession(newUser: AuthUser, accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }

  function updateUser(updates: Partial<AuthUser>) {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  function clearSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, setSession, clearSession, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
