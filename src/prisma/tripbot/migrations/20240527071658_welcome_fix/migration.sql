-- CreateTable
CREATE TABLE "wordle_scores" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "puzzle" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "grid" TEXT NOT NULL,

    CONSTRAINT "wordle_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connections_scores" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "puzzle" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "grid" TEXT NOT NULL,

    CONSTRAINT "connections_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mini_scores" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "puzzle" TEXT NOT NULL,
    "score" INTEGER NOT NULL,

    CONSTRAINT "mini_scores_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "wordle_scores" ADD CONSTRAINT "puzzlescores_userid_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "connections_scores" ADD CONSTRAINT "connectionsscores_userid_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mini_scores" ADD CONSTRAINT "miniscores_userid_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
