import axios, { type InternalAxiosRequestConfig } from 'axios';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from '@/context/AuthContext';
import { MAINTENANCE_EVENT, type MaintenanceInfo } from '@/config/maintenance';

// Base Axios instance.
// The request interceptor attaches the access token from localStorage.
// The response interceptor tries a silent token refresh on 401 before
// giving up, and redirects to /login only once that's also failed.
// See claude.md: never call the Meta Graph API directly from the frontend —
// all Facebook data comes through our own backend's /posts endpoint.

// ---------------------------------------------------------------------------
// Typed error classes — catch these in components to show contextual UI
// instead of generic error banners.
// ---------------------------------------------------------------------------

/** Thrown when the backend returns HTTP 403 (officer-position scope violation).
 *  Components should catch this and render <LockedState> instead of crashing.
 *  The message is exactly what requireOfficerPosition() sends:
 *  "This action is outside your officer role's scope" */
export class ForbiddenError extends Error {
  readonly status = 403;
  constructor(message = "This action is outside your officer role's scope") {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Bearer token to every outbound request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function clearSessionAndRedirect() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Hard redirect so stale React state is wiped too
  window.location.href = '/login';
}

// Plain axios (not the `api` instance) so this call never recurses through
// these same interceptors, and so it still goes out even if the access
// token that just 401'd is still attached to `api`'s defaults.
type RefreshOutcome = { ok: true; token: string } | { ok: false; sessionInvalid: boolean };

// The server's MAINTENANCE refusal, if that's what this error is (503 + details.code), else null.
function maintenanceFrom(err: unknown): MaintenanceInfo | null {
  const e = err as { response?: { status?: number; data?: { details?: MaintenanceInfo & { code?: string } } } };
  const details = e?.response?.data?.details;
  return e?.response?.status === 503 && details?.code === 'MAINTENANCE' ? details : null;
}

function announceMaintenance(err: unknown) {
  const info = maintenanceFrom(err);
  if (info) window.dispatchEvent(new CustomEvent(MAINTENANCE_EVENT, { detail: info }));
}

async function refreshAccessToken(): Promise<RefreshOutcome> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return { ok: false, sessionInvalid: true };

  try {
    const { data } = await axios.post<{ success: boolean; data: { accessToken: string; refreshToken: string; user: unknown } }>(
      `${BASE_URL}/auth/refresh`,
      { refreshToken },
    );
    const session = data.data;
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(session.user));
    return { ok: true, token: session.accessToken };
  } catch (err) {
    announceMaintenance(err);
    // Only a clear "this session is no longer valid" ends the session. A 503 (maintenance), a gateway error
    // or a dropped connection says nothing about the person's login, and signing them out for it was how a
    // server restart turned into everyone being locked out.
    const status = (err as { response?: { status?: number } })?.response?.status;
    return { ok: false, sessionInvalid: status === 400 || status === 401 };
  }
}

// De-dupes concurrent 401s into a single refresh call — if five requests
// 401 at the same moment (e.g. a dashboard firing several queries at once),
// they all await this one in-flight refresh instead of each hitting
// /auth/refresh separately.
let inFlightRefresh: Promise<RefreshOutcome> | null = null;

type RetriableConfig = InternalAxiosRequestConfig & { _retriedAfterRefresh?: boolean };

// On 401: try a silent refresh once, then retry the original request with
// the new access token. Only redirect to /login if there's no refresh
// token, the refresh call itself fails, or the request has already been
// retried once (so a still-401 response after a successful-looking refresh
// can't loop forever).
// On 403: re-throw as ForbiddenError so pages can render <LockedState>.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    announceMaintenance(error);
    const status = error.response?.status;
    const originalRequest = error.config as RetriableConfig | undefined;
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/refresh');

    if (status === 401 && originalRequest && !originalRequest._retriedAfterRefresh && !isAuthEndpoint) {
      originalRequest._retriedAfterRefresh = true;

      if (!inFlightRefresh) {
        inFlightRefresh = refreshAccessToken().finally(() => {
          inFlightRefresh = null;
        });
      }
      const outcome = await inFlightRefresh;

      if (outcome.ok) {
        originalRequest.headers.Authorization = `Bearer ${outcome.token}`;
        return api(originalRequest);
      }

      if (outcome.sessionInvalid) clearSessionAndRedirect();
      return Promise.reject(error);
    }

    // A 401 from /auth/login is "wrong email or password", not an expired session — let the
    // login form show the message instead of hard-reloading /login and wiping it.
    if (status === 401 && !isAuthEndpoint) {
      clearSessionAndRedirect();
    }

    if (status === 403) {
      const message =
        error.response?.data?.message ??
        "This action is outside your officer role's scope";
      return Promise.reject(new ForbiddenError(message));
    }

    return Promise.reject(error);
  },
);
