/*
  Warnings:

  - The values [Admin,Super_Admin] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `role` on table `admins` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'SUPER_ADMIN');
ALTER TABLE "admins" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
COMMIT;

-- AlterTable
ALTER TABLE "admins" ALTER COLUMN "role" SET NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'SUPER_ADMIN';
