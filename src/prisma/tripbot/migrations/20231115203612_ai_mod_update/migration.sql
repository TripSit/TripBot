-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ai_model" ADD VALUE 'GPT-3.5-TURBO-1106';
ALTER TYPE "ai_model" ADD VALUE 'GPT-4-1106-PREVIEW';
ALTER TYPE "ai_model" ADD VALUE 'GPT-4-1106-VISION-PREVIEW';
ALTER TYPE "ai_model" ADD VALUE 'DALL-E-2';
ALTER TYPE "ai_model" ADD VALUE 'DALL-E-3';

-- CreateTable
CREATE TABLE "ai_moderation" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "guild_id" TEXT,
    "harassment" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "harassment/threatening" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "hate" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "hate/threatening" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "self-harm" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "self-harm/instructions" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "self-harm/intent" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "sexual" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "sexual/minors" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "violence" DOUBLE PRECISION NOT NULL DEFAULT 0.01,
    "violence/graphic" DOUBLE PRECISION NOT NULL DEFAULT 0.01,

    CONSTRAINT "ai_moderation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aimoderation_guildid_unique" ON "ai_moderation"("guild_id");

-- AddForeignKey
ALTER TABLE "ai_moderation" ADD CONSTRAINT "appeals_guildid_foreign" FOREIGN KEY ("guild_id") REFERENCES "discord_guilds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
