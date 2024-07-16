-- CreateTable
CREATE TABLE "counting_breaks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL,
    "game_id" "counting_type" NOT NULL,
    "count" INTEGER NOT NULL,
    "last_broken_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "counting_breaks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "counting_userid_gameid_unique" ON "counting_breaks"("user_id", "game_id");

-- AddForeignKey
ALTER TABLE "counting_breaks" ADD CONSTRAINT "counting_userid_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("discord_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "counting_breaks" ADD CONSTRAINT "counting_gameid_foreign" FOREIGN KEY ("id") REFERENCES "counting"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
