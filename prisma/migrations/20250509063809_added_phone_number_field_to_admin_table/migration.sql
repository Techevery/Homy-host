/*
  Warnings:

  - A unique constraint covering the columns `[phone_number]` on the table `admins` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "phone_number" TEXT NOT NULL DEFAULT '08080000000';

-- CreateIndex
CREATE UNIQUE INDEX "admins_phone_number_key" ON "admins"("phone_number");
