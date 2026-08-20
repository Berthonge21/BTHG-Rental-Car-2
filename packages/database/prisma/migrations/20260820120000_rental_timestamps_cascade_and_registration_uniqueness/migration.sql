-- Rental -> Car: Restrict, not Cascade. A rental is realized (or
-- pending) revenue; deleting a car must never silently delete its
-- rental history along with it.
ALTER TABLE "Rental" DROP CONSTRAINT "Rental_carId_fkey";

-- Switch every model's updatedAt from @default(now()) (frozen at
-- creation, since Prisma never re-evaluates a column default on update)
-- to a real @updatedAt, which the app now keeps current on every write.
ALTER TABLE "Agency" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "AgencyUser" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "Availability" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "Car" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "Client" ALTER COLUMN "updated_at" DROP DEFAULT;
ALTER TABLE "Parking" ALTER COLUMN "updated_at" DROP DEFAULT;

-- Rental and Maintenance previously had no audit timestamps at all.
ALTER TABLE "Maintenance" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

ALTER TABLE "Rental" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- A license plate can now only be registered once per agency.
CREATE UNIQUE INDEX "Car_agencyId_registration_key" ON "Car"("agencyId", "registration");

ALTER TABLE "Rental" ADD CONSTRAINT "Rental_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
