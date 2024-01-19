-- AlterTable
ALTER TABLE "discord_guilds" ADD COLUMN     "channel_trust" TEXT,
ADD COLUMN     "trust_score_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trust_score_total" INTEGER NOT NULL DEFAULT 0;
