-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('booked', 'pending', 'expired');

-- AlterTable
ALTER TABLE "booking_periods" ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'pending';
