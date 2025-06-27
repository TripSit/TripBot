/*
  Warnings:

  - A unique constraint covering the columns `[channel_id]` on the table `ai_channels` will be added. If there are existing duplicate values, this will fail.

*/

-- DropConstraint
-- ALTER TABLE ai_channels DROP CONSTRAINT aichannels_channelid_personaid_unique;

-- DropIndex
DROP INDEX "aichannels_channelid_personaid_unique";

-- CreateIndex
CREATE UNIQUE INDEX "aichannels_channelid_unique" ON "ai_channels"("channel_id");

-- AddForeignKey
ALTER TABLE "ai_channels" ADD CONSTRAINT "aichannels_guildid_foreign" FOREIGN KEY ("guild_id") REFERENCES "discord_guilds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
