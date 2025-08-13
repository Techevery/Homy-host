-- CreateTable
CREATE TABLE "agent_listings" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "apartment_id" TEXT NOT NULL,
    "base_price" INTEGER NOT NULL,
    "markedup_price" INTEGER,
    "price_changed_by" TEXT,
    "price_changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agent_listings_agent_id_apartment_id_key" ON "agent_listings"("agent_id", "apartment_id");

-- AddForeignKey
ALTER TABLE "agent_listings" ADD CONSTRAINT "agent_listings_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_listings" ADD CONSTRAINT "agent_listings_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "apartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
