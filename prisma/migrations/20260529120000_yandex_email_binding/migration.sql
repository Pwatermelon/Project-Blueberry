-- AlterTable
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "yandexId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_yandexId_key" ON "User"("yandexId");

-- CreateTable
CREATE TABLE "OrganizationEmailBinding" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "studyGroupId" TEXT,
    "note" TEXT,
    "boundUserId" TEXT,
    "boundAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationEmailBinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizationEmailBinding_email_idx" ON "OrganizationEmailBinding"("email");

-- CreateIndex
CREATE INDEX "OrganizationEmailBinding_organizationId_idx" ON "OrganizationEmailBinding"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationEmailBinding_organizationId_email_key" ON "OrganizationEmailBinding"("organizationId", "email");

-- AddForeignKey
ALTER TABLE "OrganizationEmailBinding" ADD CONSTRAINT "OrganizationEmailBinding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationEmailBinding" ADD CONSTRAINT "OrganizationEmailBinding_studyGroupId_fkey" FOREIGN KEY ("studyGroupId") REFERENCES "StudyGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationEmailBinding" ADD CONSTRAINT "OrganizationEmailBinding_boundUserId_fkey" FOREIGN KEY ("boundUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
