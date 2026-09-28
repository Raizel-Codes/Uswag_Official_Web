import { api } from './api';
import type { PurchaseRequest, Supplier } from '@/types/procurement.types';

export async function listPurchaseRequests(): Promise<PurchaseRequest[]> {
  const { data } = await api.get<{ success: boolean; data: PurchaseRequest[] }>('/procurement/requests');
  return data.data;
}

export async function listSuppliers(): Promise<Supplier[]> {
  const { data } = await api.get<{ success: boolean; data: Supplier[] }>('/procurement/suppliers');
  return data.data;
}

export async function submitPurchaseRequest(payload: {
  item: string;
  estimatedCost: number;
  event?: string;
}): Promise<PurchaseRequest> {
  const { data } = await api.post<{ success: boolean; data: PurchaseRequest }>(
    '/procurement/requests',
    payload,
  );
  return data.data;
}
