-- CreateEnum
CREATE TYPE "ChargesStatus" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "charges" (
    "id" TEXT NOT NULL,
    "payout_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "ChargesStatus" NOT NULL DEFAULT 'inactive',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "charges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "charges_payout_id_idx" ON "charges"("payout_id");

-- AddForeignKey
ALTER TABLE "charges" ADD CONSTRAINT "charges_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "Payout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
