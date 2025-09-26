-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "channel" DROP NOT NULL,
ALTER COLUMN "charge" DROP NOT NULL,
ALTER COLUMN "payment_month" DROP NOT NULL,
ALTER COLUMN "payment_year" DROP NOT NULL;
