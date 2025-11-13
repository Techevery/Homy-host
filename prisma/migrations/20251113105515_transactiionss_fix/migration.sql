-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_agent_id_fkey";

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "agent_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
