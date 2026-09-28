import { api } from './api';
import type { AuthSession } from '@/types/auth.types';

// The backend wraps all responses as { success: boolean, data: T }
// (see utils/response.ts). We unwrap here so callers get clean types.

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const { data } = await api.post<ApiEnvelope<AuthSession>>('/auth/login', { email, password });
  return data.data;
}

export async function refreshSession(refreshToken: string): Promise<AuthSession> {
  const { data } = await api.post<ApiEnvelope<AuthSession>>('/auth/refresh', { refreshToken });
  return data.data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function forgotPassword(email: string): Promise<{ message: string; devResetUrl?: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string; devResetUrl?: string }>>('/auth/forgot-password', { email });
  return data.data;
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const { data } = await api.post<ApiEnvelope<{ message: string }>>('/auth/reset-password', { token, newPassword });
  return data.data;
}

export async function updateNavPreference(navStyle: 'auto' | 'bottom' | 'sidebar'): Promise<{ navStyle: 'auto' | 'bottom' | 'sidebar' }> {
  const { data } = await api.patch<ApiEnvelope<{ navStyle: 'auto' | 'bottom' | 'sidebar' }>>('/auth/me/preference', { navStyle });
  return data.data;
}
