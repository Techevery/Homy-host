/*
  Warnings:

  - Made the column `duration_days` on table `transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "_AgentApartments" ADD CONSTRAINT "_AgentApartments_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_AgentApartments_AB_unique";

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "duration_days" SET NOT NULL;
