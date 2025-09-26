/*
  Warnings:

  - You are about to drop the column `payment_month` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `payment_year` on the `transactions` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "date_idx";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "payment_month",
DROP COLUMN "payment_year";

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
