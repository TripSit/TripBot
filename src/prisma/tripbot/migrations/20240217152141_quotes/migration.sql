/*
  Warnings:

  - The values [GPT-4,DAVINCI,CURIE,BABBAGE,ADA,GPT-3.5-TURBO-1106,GPT-4-1106-PREVIEW,GPT-4-1106-VISION-PREVIEW,DALL-E-2] on the enum `ai_model` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[channel_id]` on the table `ai_channels` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `guild_id` to the `ai_channels` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ai_model_new" AS ENUM ('GPT-3.5-TURBO', 'GPT-4-TURBO', 'DALL-E-3', 'GEMINI-PRO');
ALTER TABLE "ai_personas" ALTER COLUMN "ai_model" TYPE "ai_model_new" USING ("ai_model"::text::"ai_model_new");
ALTER TABLE "ai_images" ALTER COLUMN "model" TYPE "ai_model_new" USING ("model"::text::"ai_model_new");
ALTER TYPE "ai_model" RENAME TO "ai_model_old";
ALTER TYPE "ai_model_new" RENAME TO "ai_model";
DROP TYPE "ai_model_old";
COMMIT;

-- DropIndex
DROP INDEX "aichannels_channelid_personaid_unique";

-- AlterTable
ALTER TABLE "ai_channels" ADD COLUMN     "guild_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ai_personas" ADD COLUMN     "description" TEXT,
ADD COLUMN     "downvotes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "public" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "upvotes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ai_history_google" TEXT,
ADD COLUMN     "ai_history_openai" TEXT,
ADD COLUMN     "ai_terms_agree" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "aichannels_channelid_unique" ON "ai_channels"("channel_id");

-- AddForeignKey
ALTER TABLE "ai_channels" ADD CONSTRAINT "aichannels_guildid_foreign" FOREIGN KEY ("guild_id") REFERENCES "discord_guilds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
