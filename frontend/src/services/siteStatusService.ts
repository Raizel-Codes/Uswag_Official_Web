import axios from 'axios';
import { BASE_URL } from './api';
import type { MaintenanceInfo } from '@/config/maintenance';

export interface SiteStatus {
  maintenance: { enabled: boolean } & Omit<MaintenanceInfo, 'serverTime'>;
  serverTime: string;
}

// Plain axios, not the shared `api` instance: this has to work signed out, mid-maintenance and with an
// expired token, without the auth interceptors (refresh, redirect) getting involved.
export async function getSiteStatus(): Promise<SiteStatus> {
  const { data } = await axios.get<{ success: boolean; data: SiteStatus }>(`${BASE_URL}/status`, { timeout: 8000 });
  return data.data;
}
