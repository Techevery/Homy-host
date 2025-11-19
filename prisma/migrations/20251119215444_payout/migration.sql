/*
  Warnings:

  - Added the required column `reference` to the `Payout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "proof" TEXT,
ADD COLUMN     "reference" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Payout_id_status_reference_idx" ON "Payout"("id", "status", "reference");
