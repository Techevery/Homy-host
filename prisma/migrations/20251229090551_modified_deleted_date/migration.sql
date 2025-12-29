-- AlterTable
ALTER TABLE "deleted_bookings" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
