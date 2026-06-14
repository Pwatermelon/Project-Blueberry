-- Tenant pack, hub federation, building floors

ALTER TYPE "ScheduleSource" ADD VALUE IF NOT EXISTS 'LEGACY_TXT';
ALTER TYPE "ScheduleSource" ADD VALUE IF NOT EXISTS 'JSON_IMPORT';

ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "tenantPackSlug" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "siteUrl" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "hubBaseUrl" TEXT;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hubProfileId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_hubProfileId_key" ON "User"("hubProfileId");

ALTER TABLE "ChatRoom" ADD COLUMN IF NOT EXISTS "scope" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "ChatRoom" ADD COLUMN IF NOT EXISTS "hubChannelId" TEXT;

ALTER TABLE "CampusBuilding" ADD COLUMN IF NOT EXISTS "floors" JSONB NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS "FederatedProfile" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "tenants" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FederatedProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FederatedProfile_email_key" ON "FederatedProfile"("email");

CREATE TABLE IF NOT EXISTS "FederatedChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FederatedChannel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "FederatedMessage" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FederatedMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FederatedMessage_channelId_createdAt_idx" ON "FederatedMessage"("channelId", "createdAt");

ALTER TABLE "FederatedMessage" DROP CONSTRAINT IF EXISTS "FederatedMessage_channelId_fkey";
ALTER TABLE "FederatedMessage" ADD CONSTRAINT "FederatedMessage_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "FederatedChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FederatedMessage" DROP CONSTRAINT IF EXISTS "FederatedMessage_profileId_fkey";
ALTER TABLE "FederatedMessage" ADD CONSTRAINT "FederatedMessage_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "FederatedProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
