-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'Super_Admin');

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "role" "Role";
