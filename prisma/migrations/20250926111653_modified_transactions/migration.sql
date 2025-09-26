-- AlterTable
ALTER TABLE "agents" ADD COLUMN     "accountBalance" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "credited" BOOLEAN NOT NULL DEFAULT false;
