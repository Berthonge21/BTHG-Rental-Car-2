-- CreateIndex
CREATE INDEX "Car_agencyId_idx" ON "Car"("agencyId");

-- CreateIndex
CREATE INDEX "Car_agencyId_created_at_idx" ON "Car"("agencyId", "created_at");

-- CreateIndex
CREATE INDEX "Maintenance_carId_idx" ON "Maintenance"("carId");

-- CreateIndex
CREATE INDEX "Notification_agencyId_read_status_idx" ON "Notification"("agencyId", "read_status");

-- CreateIndex
CREATE INDEX "Parking_agencyId_idx" ON "Parking"("agencyId");

-- CreateIndex
CREATE INDEX "Rental_clientId_idx" ON "Rental"("clientId");

-- CreateIndex
CREATE INDEX "Rental_carId_status_idx" ON "Rental"("carId", "status");

-- CreateIndex
CREATE INDEX "Rental_status_endDate_idx" ON "Rental"("status", "endDate");

-- CreateIndex
CREATE INDEX "Rental_carId_startDate_endDate_idx" ON "Rental"("carId", "startDate", "endDate");

-- ExclusionConstraint: prevents two reserved/ongoing rentals for the same
-- car from ever having overlapping date ranges, even under concurrent
-- writes that a check-then-insert application transaction cannot fully
-- rule out on its own. Requires btree_gist for the integer equality term.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Rental"
  ADD CONSTRAINT "Rental_no_overlapping_bookings"
  EXCLUDE USING gist (
    "carId" WITH =,
    tsrange("startDate", "endDate", '[]') WITH &&
  )
  WHERE (status IN ('reserved', 'ongoing'));
