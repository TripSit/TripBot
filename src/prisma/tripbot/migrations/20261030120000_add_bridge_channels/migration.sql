-- CreateTable
CREATE TABLE "bridge_channels" (
    "discord_channel_id" TEXT NOT NULL,
    "irc_channel" VARCHAR(200) NOT NULL,
    "gateway_name" TEXT NOT NULL,
    "matrix_room_id" TEXT,
    "topic" TEXT,
    "source" TEXT NOT NULL DEFAULT 'auto',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "irc_registered" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bridge_channels_pkey" PRIMARY KEY ("discord_channel_id","irc_channel")
);

-- CreateIndex
CREATE UNIQUE INDEX "bridge_channels_irc_channel_key" ON "bridge_channels"("irc_channel");

-- CreateIndex
CREATE INDEX "bridge_channels_discord_channel_id_idx" ON "bridge_channels"("discord_channel_id");
