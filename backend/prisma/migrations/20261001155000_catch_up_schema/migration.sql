-- Catch-up: purchase requests/suppliers, Post.type and User.navStyle were added to schema.prisma and
-- pushed to the development database (prisma db push) without a migration, so a database built only
-- from these migrations was missing them. Every statement is guarded so this does nothing where the
-- objects already exist (the development database) and creates them everywhere else.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PurchaseRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'NEWS';

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "navStyle" TEXT NOT NULL DEFAULT 'auto';

-- CreateTable
CREATE TABLE IF NOT EXISTS "PurchaseRequest" (
    "id" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "estimatedCost" DOUBLE PRECISION NOT NULL,
    "event" TEXT,
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactInfo" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PurchaseRequest_requestedById_idx" ON "PurchaseRequest"("requestedById");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PurchaseRequest" ADD CONSTRAINT "PurchaseRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
