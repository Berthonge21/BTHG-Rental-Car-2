-- AlterTable
ALTER TABLE "AgencyUser" ADD COLUMN     "agencyId" INTEGER;

-- CreateIndex
CREATE INDEX "AgencyUser_agencyId_idx" ON "AgencyUser"("agencyId");

-- AddForeignKey
ALTER TABLE "AgencyUser" ADD CONSTRAINT "AgencyUser_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DataMigration: backfill agencyId for existing responsible admins.
-- Every admin who is already an Agency's responsibleId is, at minimum, a
-- member of that agency — set their new agencyId accordingly so this
-- migration does not lock anyone out once the app starts treating
-- AgencyUser.agencyId as the source of truth for tenant scoping.
UPDATE "AgencyUser" au
SET "agencyId" = a.id
FROM "Agency" a
WHERE a."responsibleId" = au.id
  AND au."agencyId" IS NULL;
