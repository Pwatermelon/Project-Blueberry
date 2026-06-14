-- CreateTable
CREATE TABLE "RegisteredTenant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#4f46e5',
    "accentColor" TEXT NOT NULL DEFAULT '#a855f7',
    "siteUrl" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegisteredTenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegisteredTenant_slug_key" ON "RegisteredTenant"("slug");

-- CreateIndex
CREATE INDEX "RegisteredTenant_isPublished_sortOrder_idx" ON "RegisteredTenant"("isPublished", "sortOrder");
