-- AlterTable
ALTER TABLE "users" ALTER COLUMN "last_helper_activity" DROP DEFAULT;

-- CreateTable
CREATE TABLE "claimed_bounties" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "claimed_bounties_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "claimed_bounties" ADD CONSTRAINT "claimed_bounties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("discord_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
