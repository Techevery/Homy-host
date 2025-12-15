-- AlterTable
ALTER TABLE "apartment_logs" ADD COLUMN     "agentId" TEXT;

-- AddForeignKey
ALTER TABLE "apartment_logs" ADD CONSTRAINT "apartment_logs_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
