/*
  Warnings:

  - The primary key for the `members` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - the `id` column on the `members` table would be renamed to `discord_id`. If there are existing foreign keys referencing this column, this will fail.
  - The `id` column on the `members` table would be dropped and recreated. 
  - A unique constraint covering the columns `[discord_id,guild_id]` on the table `members` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `discord_id` to the `members` table without a default value. This is not possible if the table is not empty.
*/

-- Add a new column `new_discord_id` temporarily
ALTER TABLE "members" ADD COLUMN "new_discord_id" TEXT;

-- Copy `id` values to `new_discord_id`
UPDATE "members" SET "new_discord_id" = "id";

-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_id_foreign";

-- DropIndex
DROP INDEX "members_id_guildid_unique";

-- Rename `new_discord_id` to `discord_id`
ALTER TABLE "members" RENAME COLUMN "new_discord_id" TO "discord_id";

-- Drop the old `id` column and its primary key constraint
ALTER TABLE "members" DROP CONSTRAINT "members_pkey";
ALTER TABLE "members" DROP COLUMN "id";

-- Add a new `id` column and set it as the primary key in one statement
ALTER TABLE "members" ADD COLUMN "id" UUID NOT NULL DEFAULT uuid_generate_v4();
ALTER TABLE "members" ADD CONSTRAINT "members_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "members_discordid_guildid_unique" ON "members"("discord_id", "guild_id");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_discordid_foreign" FOREIGN KEY ("discord_id") REFERENCES "users"("discord_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
