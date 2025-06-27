-- CreateTable
CREATE TABLE "watch_request" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "notification_method" TEXT NOT NULL,
    "channel_id" TEXT,
    "caller_id" TEXT NOT NULL,
    "watched_user_id" TEXT NOT NULL,
    "usersId" UUID,

    CONSTRAINT "watch_request_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "watch_request" ADD CONSTRAINT "watch_request_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
