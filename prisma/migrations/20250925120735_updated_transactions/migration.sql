/*
  Warnings:

  - Added the required column `payment_month` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `payment_year` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "payment_month" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "payment_year" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "date_idx" ON "transactions"("payment_month", "payment_year");
