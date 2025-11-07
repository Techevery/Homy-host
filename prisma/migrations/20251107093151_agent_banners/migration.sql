/*
  Warnings:

  - You are about to drop the column `agentId` on the `Banner` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Banner" DROP CONSTRAINT "Banner_agentId_fkey";

-- AlterTable
ALTER TABLE "Banner" DROP COLUMN "agentId";

-- CreateTable
CREATE TABLE "AgentBanner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "agentId" TEXT NOT NULL,
    "image_url" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentBanner_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AgentBanner" ADD CONSTRAINT "AgentBanner_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
