/*
  Warnings:

  - You are about to drop the column `agentPercentage` on the `agent_listings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "agent_listings" DROP COLUMN "agentPercentage",
ADD COLUMN     "agent_commission_percent" INTEGER;
