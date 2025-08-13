-- AlterTable
ALTER TABLE "apartment_logs" ADD COLUMN     "booking_end_date" TIMESTAMP(3),
ADD COLUMN     "booking_start_date" TIMESTAMP(3),
ADD COLUMN     "duration_days" INTEGER;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "booking_end_date" TIMESTAMP(3),
ADD COLUMN     "booking_start_date" TIMESTAMP(3),
ADD COLUMN     "duration_days" INTEGER;
