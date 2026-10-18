-- CreateTable: the one-row "site is under maintenance" switch (see services/maintenance.service.ts).
CREATE TABLE "SiteMaintenance" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "message" TEXT,
    "setById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteMaintenance_pkey" PRIMARY KEY ("id")
);
