-- AlterEnum
ALTER TYPE "werewolf_role" ADD VALUE 'DOCTOR';

-- CreateEnum
CREATE TYPE "werewolf_night_action" AS ENUM ('PEEK', 'PROTECT', 'REVENGE');

-- CreateTable
CREATE TABLE "werewolf_night_actions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "game_id" UUID NOT NULL,
    "day" INTEGER NOT NULL,
    "action" "werewolf_night_action" NOT NULL,
    "actor_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "werewolf_night_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "werewolfnightactions_gameid_day_action_actorid_unique" ON "werewolf_night_actions"("game_id", "day", "action", "actor_id");

-- AddForeignKey
ALTER TABLE "werewolf_night_actions" ADD CONSTRAINT "werewolfnightactions_gameid_foreign" FOREIGN KEY ("game_id") REFERENCES "werewolf_games"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
