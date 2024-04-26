/*
  Warnings:

  - You are about to drop the column `preferredTentMode` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tent_settings" ADD COLUMN     "join_level" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "preferredTentMode",
ADD COLUMN     "defaultTentMode" "tent_publicity" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "joinTentLevel" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "defaultTentName" DROP NOT NULL,
ALTER COLUMN "defaultTentName" DROP DEFAULT;
