// Shared by the API client (which announces a 503 MAINTENANCE), the status hook and the maintenance page.

/** Fired on `window` whenever any API call is refused because the site is in maintenance. detail: MaintenanceInfo. */
export const MAINTENANCE_EVENT = 'uswag:maintenance';

/** What the visitor needs to know. endsAt is an estimate: nothing reopens the site by itself. */
export interface MaintenanceInfo {
  startedAt: string | null;
  endsAt: string | null;
  message: string | null;
  /** The server's clock when this was read, so the countdown ignores a wrong clock on the visitor's device. */
  serverTime?: string;
}

/** The last maintenance notice seen, kept so the page still shows if the API is unreachable (it usually is mid-deploy). */
export const MAINTENANCE_MEMORY_KEY = 'uswag_maintenance_seen';
/** How long that memory is trusted without hearing from the server. */
export const MAINTENANCE_MEMORY_MS = 3 * 60 * 60 * 1000;
