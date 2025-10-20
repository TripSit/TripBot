/*
  Warnings:

  - The values [OPEN] on the enum `appeal_status` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `appeal_message_id` on the `appeals` table. All the data in the column will be lost.
  - You are about to drop the column `appeal_number` on the `appeals` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "appeal_status_new" AS ENUM ('RECEIVED', 'ACCEPTED', 'DENIED');
ALTER TABLE "appeals" ALTER COLUMN "status" TYPE "appeal_status_new" USING ("status"::text::"appeal_status_new");
ALTER TYPE "appeal_status" RENAME TO "appeal_status_old";
ALTER TYPE "appeal_status_new" RENAME TO "appeal_status";
DROP TYPE "appeal_status_old";
COMMIT;

-- DropIndex
DROP INDEX "appeals_user_id_guild_id_appeal_number_unique";

-- AlterTable
ALTER TABLE "appeals" DROP COLUMN "appeal_message_id",
DROP COLUMN "appeal_number";
