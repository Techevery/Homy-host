/*
  Warnings:

  - You are about to drop the column `new_end_date` on the `booking_periods` table. All the data in the column will be lost.
  - You are about to drop the column `new_start_date` on the `booking_periods` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "booking_periods" DROP COLUMN "new_end_date",
DROP COLUMN "new_start_date";
