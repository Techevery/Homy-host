-- AlterTable
ALTER TABLE "Banner" ADD COLUMN     "agentId" TEXT;

-- AddForeignKey
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
