-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'superAdmin');

-- CreateEnum
CREATE TYPE "ClientRole" AS ENUM ('user');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('reserved', 'ongoing', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('activate', 'deactivate');

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "reservationId" INTEGER,
    "message" VARCHAR(500) NOT NULL,
    "read_status" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "firstname" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(200) NOT NULL,
    "telephone" VARCHAR(100) NOT NULL,
    "numPermis" VARCHAR(15) NOT NULL,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "role" "ClientRole" NOT NULL DEFAULT 'user',
    "status" "Status" NOT NULL DEFAULT 'activate',
    "deactivated_at" TIMESTAMP(3),
    "address" VARCHAR(150) NOT NULL,
    "city" VARCHAR(100) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyUser" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "firstname" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(200) NOT NULL,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "UserRole" NOT NULL DEFAULT 'admin',
    "status" "Status" NOT NULL DEFAULT 'activate',
    "deactivated_at" TIMESTAMP(3),

    CONSTRAINT "AgencyUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agency" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "address" VARCHAR(200) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "telephone" VARCHAR(15) NOT NULL,
    "responsibleId" INTEGER NOT NULL,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "Status" NOT NULL DEFAULT 'activate',

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parking" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "address" VARCHAR(200) NOT NULL,
    "city" VARCHAR(200) NOT NULL,

    CONSTRAINT "Parking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Car" (
    "id" SERIAL NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "brand" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "year" INTEGER NOT NULL,
    "mileage" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "registration" VARCHAR(20) NOT NULL,
    "parkingId" INTEGER,
    "description" VARCHAR(300),
    "fuel" VARCHAR(50) NOT NULL,
    "door" INTEGER NOT NULL,
    "gearBox" VARCHAR(25) NOT NULL,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rental" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "carId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "status" "RentalStatus" NOT NULL DEFAULT 'reserved',

    CONSTRAINT "Rental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(350) NOT NULL,
    "carId" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Availability" (
    "id" SERIAL NOT NULL,
    "carId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyUser_email_key" ON "AgencyUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_name_key" ON "Agency"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_email_key" ON "Agency"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_responsibleId_key" ON "Agency"("responsibleId");

-- CreateIndex
CREATE UNIQUE INDEX "Availability_carId_date_key" ON "Availability"("carId", "date");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Rental"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agency" ADD CONSTRAINT "Agency_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "AgencyUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parking" ADD CONSTRAINT "Parking_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "Parking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;
