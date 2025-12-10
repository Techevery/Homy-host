/*
  Warnings:

  - You are about to drop the column `payout_id` on the `charges` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `charges` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "charges" DROP CONSTRAINT "charges_payout_id_fkey";

-- DropIndex
DROP INDEX "charges_payout_id_idx";

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "charges" INTEGER;

-- AlterTable
ALTER TABLE "charges" DROP COLUMN "payout_id",
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "charges_status_idx" ON "charges"("status");
