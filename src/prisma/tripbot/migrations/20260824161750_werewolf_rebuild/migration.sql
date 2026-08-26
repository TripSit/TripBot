-- CreateEnum
CREATE TYPE "werewolf_phase" AS ENUM ('LOBBY', 'NIGHT', 'MORNING', 'AFTERNOON', 'EVENING', 'ENDED');

-- CreateEnum
CREATE TYPE "werewolf_team" AS ENUM ('TOWN', 'WOLVES');

-- CreateEnum
CREATE TYPE "werewolf_role" AS ENUM ('VILLAGER', 'WOLF', 'SEER', 'HUNTER');

-- CreateTable
CREATE TABLE "werewolf_games" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "guild_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "wolfden_channel_id" TEXT,
    "phase" "werewolf_phase" NOT NULL DEFAULT 'LOBBY',
    "phase_end_time" TIMESTAMPTZ(6),
    "day" INTEGER NOT NULL DEFAULT 0,
    "message_id" TEXT,
    "wolf_message_id" TEXT,
    "winning_team" "werewolf_team",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "werewolf_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "werewolf_players" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "game_id" UUID NOT NULL,
    "discord_id" TEXT NOT NULL,
    "role" "werewolf_role" NOT NULL DEFAULT 'VILLAGER',
    "team" "werewolf_team" NOT NULL DEFAULT 'TOWN',
    "is_alive" BOOLEAN NOT NULL DEFAULT true,
    "killed_on_day" INTEGER,
    "hung_on_day" INTEGER,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "werewolf_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "werewolf_votes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "game_id" UUID NOT NULL,
    "day" INTEGER NOT NULL,
    "phase" "werewolf_phase" NOT NULL,
    "voter_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "werewolf_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "werewolf_diary_entries" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "game_id" UUID NOT NULL,
    "discord_id" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "entry" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "werewolf_diary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "werewolfgames_guildid_unique" ON "werewolf_games"("guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "werewolfplayers_gameid_discordid_unique" ON "werewolf_players"("game_id", "discord_id");

-- CreateIndex
CREATE UNIQUE INDEX "werewolfvotes_gameid_day_phase_voterid_unique" ON "werewolf_votes"("game_id", "day", "phase", "voter_id");

-- AddForeignKey
ALTER TABLE "werewolf_players" ADD CONSTRAINT "werewolfplayers_gameid_foreign" FOREIGN KEY ("game_id") REFERENCES "werewolf_games"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "werewolf_votes" ADD CONSTRAINT "werewolfvotes_gameid_foreign" FOREIGN KEY ("game_id") REFERENCES "werewolf_games"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "werewolf_diary_entries" ADD CONSTRAINT "werewolfdiary_gameid_foreign" FOREIGN KEY ("game_id") REFERENCES "werewolf_games"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
