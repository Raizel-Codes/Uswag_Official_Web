// Mirrors PurchaseRequest / Supplier in schema.prisma. Status stays
// UPPERCASE end-to-end (no DTO remapping on the backend for this resource).

export type PurchaseRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PurchaseRequest {
  id: string;
  item: string;
  estimatedCost: number;
  event: string | null;
  status: PurchaseRequestStatus;
  requestedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactInfo: string | null;
  category: string | null;
  createdAt: string;
}
