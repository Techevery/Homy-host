/*
  Warnings:

  - The primary key for the `_AgentApartments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[A,B]` on the table `_AgentApartments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `transactionId` to the `Payout` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "transactionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "_AgentApartments" DROP CONSTRAINT "_AgentApartments_AB_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "_AgentApartments_AB_unique" ON "_AgentApartments"("A", "B");

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
