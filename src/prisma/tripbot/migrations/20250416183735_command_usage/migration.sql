-- CreateTable
CREATE TABLE "command_usage" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "command" TEXT NOT NULL,
    "guild_id" TEXT,
    "channel_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "command_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "command_usage_parameter" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "usage_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "command_usage_parameter_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "command_usage" ADD CONSTRAINT "command_usage_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "discord_guilds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "command_usage_parameter" ADD CONSTRAINT "command_usage_parameter_usage_id_fkey" FOREIGN KEY ("usage_id") REFERENCES "command_usage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
