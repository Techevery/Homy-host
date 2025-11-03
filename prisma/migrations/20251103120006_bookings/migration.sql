/*
  Warnings:

  - You are about to drop the column `booking_end_date` on the `apartment_logs` table. All the data in the column will be lost.
  - You are about to drop the column `booking_start_date` on the `apartment_logs` table. All the data in the column will be lost.
  - You are about to drop the column `duration_days` on the `apartment_logs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "apartment_logs" DROP COLUMN "booking_end_date",
DROP COLUMN "booking_start_date",
DROP COLUMN "duration_days",
ADD COLUMN     "booking_period_id" TEXT;

-- CreateTable
CREATE TABLE "booking_periods" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "apartment_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booking_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_periods_transaction_id_idx" ON "booking_periods"("transaction_id");

-- CreateIndex
CREATE INDEX "booking_periods_apartment_id_idx" ON "booking_periods"("apartment_id");

-- CreateIndex
CREATE INDEX "booking_periods_start_date_end_date_idx" ON "booking_periods"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "apartment_logs_booking_period_id_idx" ON "apartment_logs"("booking_period_id");

-- AddForeignKey
ALTER TABLE "booking_periods" ADD CONSTRAINT "booking_periods_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_periods" ADD CONSTRAINT "booking_periods_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apartment_logs" ADD CONSTRAINT "apartment_logs_booking_period_id_fkey" FOREIGN KEY ("booking_period_id") REFERENCES "booking_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "apartment_idx" RENAME TO "apartment_logs_apartment_id_idx";

-- RenameIndex
ALTER INDEX "transaction_idx" RENAME TO "apartment_logs_transaction_id_idx";
