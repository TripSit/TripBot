-- AlterTable
ALTER TABLE "discord_guilds" ADD COLUMN     "channel_helpdesk" TEXT,
ADD COLUMN     "channel_mod_log" TEXT,
ADD COLUMN     "channel_moderators" TEXT,
ADD COLUMN     "cooperative" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role_moderator" TEXT,
ADD COLUMN     "trust_score_limit" INTEGER NOT NULL DEFAULT 5,
ALTER COLUMN "partner" SET DEFAULT false,
ALTER COLUMN "supporter" SET DEFAULT false;

-- AlterTable
ALTER TABLE "user_actions" ADD COLUMN     "guild_id" TEXT NOT NULL DEFAULT '179641883222474752';

-- AddForeignKey
ALTER TABLE "user_actions" ADD CONSTRAINT "appeals_guildid_foreign" FOREIGN KEY ("guild_id") REFERENCES "discord_guilds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
