-- CreateTable
CREATE TABLE "ForgetPassword" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForgetPassword_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ForgetPassword_agentId_key" ON "ForgetPassword"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "ForgetPassword_token_key" ON "ForgetPassword"("token");

-- CreateIndex
CREATE INDEX "ForgetPassword_token_idx" ON "ForgetPassword"("token");

-- AddForeignKey
ALTER TABLE "ForgetPassword" ADD CONSTRAINT "ForgetPassword_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
