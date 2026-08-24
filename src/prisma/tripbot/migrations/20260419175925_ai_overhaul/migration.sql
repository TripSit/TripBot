/*
  Warnings:

  - You are about to drop the column `ai_history_google` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `ai_history_openai` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `ai_terms_agree` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `ai_channels` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_personas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ai_usage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ai_channels" DROP CONSTRAINT "aichannels_guildid_foreign";

-- DropForeignKey
ALTER TABLE "ai_channels" DROP CONSTRAINT "aichannels_personaid_foreign";

-- DropForeignKey
ALTER TABLE "ai_images" DROP CONSTRAINT "aiimages_userid_foreign";

-- DropForeignKey
ALTER TABLE "ai_personas" DROP CONSTRAINT "aipersonas_createdby_foreign";

-- DropForeignKey
ALTER TABLE "ai_usage" DROP CONSTRAINT "aiusage_userid_foreign";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "ai_history_google",
DROP COLUMN "ai_history_openai",
DROP COLUMN "ai_terms_agree";

-- DropTable
DROP TABLE "ai_channels";

-- DropTable
DROP TABLE "ai_images";

-- DropTable
DROP TABLE "ai_personas";

-- DropTable
DROP TABLE "ai_usage";

-- DropEnum
DROP TYPE "ai_model";

-- CreateTable
CREATE TABLE "ai_info" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "ai_tos_agree" TIMESTAMP(3),
    "ai_privacy_agree" TIMESTAMP(3),
    "persona_id" TEXT NOT NULL DEFAULT 'tripbot',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_persona" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_message" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ai_persona_id" UUID NOT NULL,
    "message_id" TEXT NOT NULL,
    "ai_info_id" UUID,
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "usd" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_image" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "ai_info_id" UUID NOT NULL,
    "prompt" TEXT NOT NULL,
    "revised_prompt" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_channel" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "channel_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,

    CONSTRAINT "ai_channel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_info_user_id_key" ON "ai_info"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_persona_name_key" ON "ai_persona"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ai_message_message_id_key" ON "ai_message"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_channel_channel_id_key" ON "ai_channel"("channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "aichannels_channelid_guildid_unique" ON "ai_channel"("channel_id", "guild_id");

-- AddForeignKey
ALTER TABLE "ai_info" ADD CONSTRAINT "ai_info_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_message" ADD CONSTRAINT "aimessage_ai_persona_id_foreign" FOREIGN KEY ("ai_persona_id") REFERENCES "ai_persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_message" ADD CONSTRAINT "aimessage_ai_info_id_foreign" FOREIGN KEY ("ai_info_id") REFERENCES "ai_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_image" ADD CONSTRAINT "ai_images_ai_info_id_foreign" FOREIGN KEY ("ai_info_id") REFERENCES "ai_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_channel" ADD CONSTRAINT "aichannels_guildid_foreign" FOREIGN KEY ("guild_id") REFERENCES "discord_guilds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
