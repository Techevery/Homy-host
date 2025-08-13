-- AlterTable
ALTER TABLE "apartment" ADD COLUMN     "video_link" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "phone_number" TEXT;

-- CreateTable
CREATE TABLE "failed_transactions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "charge" TEXT NOT NULL,
    "metadata" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "failure_reason" TEXT,
    "error_code" TEXT,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_month" DECIMAL(65,30) NOT NULL,
    "payment_year" INTEGER NOT NULL,
    "apartment_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,

    CONSTRAINT "failed_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "failed_transactions_reference_key" ON "failed_transactions"("reference");

-- CreateIndex
CREATE INDEX "failed_tx_ref_idx" ON "failed_transactions"("reference");

-- CreateIndex
CREATE INDEX "failed_agent_idx" ON "failed_transactions"("agent_id");

-- CreateIndex
CREATE INDEX "failed_apartment_idx" ON "failed_transactions"("apartment_id");

-- CreateIndex
CREATE INDEX "failed_date_idx" ON "failed_transactions"("payment_month", "payment_year");

-- AddForeignKey
ALTER TABLE "failed_transactions" ADD CONSTRAINT "failed_transactions_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "failed_transactions" ADD CONSTRAINT "failed_transactions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
