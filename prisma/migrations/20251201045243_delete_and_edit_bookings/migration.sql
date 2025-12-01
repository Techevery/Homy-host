-- AlterTable
ALTER TABLE "booking_periods" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "new_end_date" TIMESTAMP(3),
ADD COLUMN     "new_start_date" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "deleted_bookings" (
    "id" TEXT NOT NULL,
    "booking_period_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deleted_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deleted_bookings_booking_period_id_idx" ON "deleted_bookings"("booking_period_id");

-- AddForeignKey
ALTER TABLE "deleted_bookings" ADD CONSTRAINT "deleted_bookings_booking_period_id_fkey" FOREIGN KEY ("booking_period_id") REFERENCES "booking_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
