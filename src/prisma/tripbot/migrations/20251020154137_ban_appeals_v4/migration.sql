/*
  Warnings:

  - The values [OPEN] on the enum `appeal_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "appeal_status_new" AS ENUM ('RECEIVED', 'ACCEPTED', 'DENIED');
ALTER TABLE "appeals" ALTER COLUMN "status" TYPE "appeal_status_new" USING ("status"::text::"appeal_status_new");
ALTER TYPE "appeal_status" RENAME TO "appeal_status_old";
ALTER TYPE "appeal_status_new" RENAME TO "appeal_status";
DROP TYPE "appeal_status_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "user_action_type" ADD VALUE 'APPEAL_ACCEPT';
ALTER TYPE "user_action_type" ADD VALUE 'APPEAL_REJECT';

-- AlterTable
ALTER TABLE "appeals" ALTER COLUMN "appeal_number" DROP NOT NULL,
ALTER COLUMN "appeal_message_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "supporter" SET DEFAULT false;
