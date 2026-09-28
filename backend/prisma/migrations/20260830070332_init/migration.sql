-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'OFFICER_ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "OfficerPosition" AS ENUM ('PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'AUDITOR', 'BUSINESS_MANAGER', 'PRO');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'PENDING', 'EXPIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EventPillar" AS ENUM ('YOUTH_VOICE', 'MENTAL_HEALTH', 'ENVIRONMENTAL');

-- CreateEnum
CREATE TYPE "EventScope" AS ENUM ('IN_CAMPUS', 'OUT_OF_CAMPUS');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScanResult" AS ENUM ('VALID', 'INVALID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PostSource" AS ENUM ('FACEBOOK', 'MANUAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "officerPosition" "OfficerPosition",
    "collegeOrDept" TEXT NOT NULL,
    "yearLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "academicYear" TEXT NOT NULL,
    "qrIssuedAt" TIMESTAMP(3),
    "qrVersion" INTEGER NOT NULL DEFAULT 1,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "MemberProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UswagEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pillar" "EventPillar" NOT NULL,
    "scope" "EventScope" NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "location" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "limitedSlots" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UswagEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRsvp" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT,
    "scannedByOfficerId" TEXT NOT NULL,
    "result" "ScanResult" NOT NULL,
    "reason" TEXT,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "source" "PostSource" NOT NULL,
    "body" TEXT NOT NULL,
    "imageUrl" TEXT,
    "permalink" TEXT,
    "facebookPostId" TEXT,
    "authorId" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "likeCount" INTEGER,
    "commentCount" INTEGER,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmendmentLog" (
    "id" TEXT NOT NULL,
    "articleRef" TEXT NOT NULL,
    "proposal" TEXT NOT NULL,
    "proposedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "AmendmentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLogEntry" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MemberProfile_userId_key" ON "MemberProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberProfile_serialNumber_key" ON "MemberProfile"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EventRsvp_eventId_memberId_key" ON "EventRsvp"("eventId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_permalink_key" ON "Post"("permalink");

-- CreateIndex
CREATE UNIQUE INDEX "Post_facebookPostId_key" ON "Post"("facebookPostId");

-- AddForeignKey
ALTER TABLE "MemberProfile" ADD CONSTRAINT "MemberProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "UswagEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRsvp" ADD CONSTRAINT "EventRsvp_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "UswagEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "MemberProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_scannedByOfficerId_fkey" FOREIGN KEY ("scannedByOfficerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLogEntry" ADD CONSTRAINT "AuditLogEntry_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
