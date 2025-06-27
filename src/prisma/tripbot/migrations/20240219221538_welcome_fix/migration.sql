-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "trusted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_id_guildid_unique" ON "members"("id", "guild_id");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_id_foreign" FOREIGN KEY ("id") REFERENCES "users"("discord_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_guildid_foreign" FOREIGN KEY ("guild_id") REFERENCES "discord_guilds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
