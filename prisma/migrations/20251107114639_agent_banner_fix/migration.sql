/*
  Warnings:

  - You are about to drop the `AgentBanner` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AgentBanner" DROP CONSTRAINT "AgentBanner_agentId_fkey";

-- DropTable
DROP TABLE "AgentBanner";

-- CreateTable
CREATE TABLE "agent_banners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "agentId" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_banner_agent_idx" ON "agent_banners"("agentId");

-- AddForeignKey
ALTER TABLE "agent_banners" ADD CONSTRAINT "agent_banners_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
