import { prisma } from '../config/db.js';

export async function submitPurchaseRequest(
  userId: string,
  item: string,
  estimatedCost: number,
  event?: string
) {
  return prisma.purchaseRequest.create({
    data: {
      item,
      estimatedCost,
      event,
      requestedById: userId,
    },
    include: {
      requestedBy: {
        select: { name: true },
      },
    },
  });
}

export async function listPurchaseRequests(limit = 20) {
  return prisma.purchaseRequest.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      requestedBy: {
        select: { name: true },
      },
    },
  });
}

export async function listSuppliers() {
  return prisma.supplier.findMany({
    orderBy: { name: 'asc' },
  });
}
