-- CreateTable
CREATE TABLE "best_of" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "best_of_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "best_of_message_id_key" ON "best_of"("message_id");

-- AddForeignKey
ALTER TABLE "best_of" ADD CONSTRAINT "best_of_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("discord_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
