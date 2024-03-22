-- CreateEnum
CREATE TYPE "tent_publicity" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "banlist" TEXT[],
ADD COLUMN     "preferredTentMode" TEXT NOT NULL DEFAULT 'public',
ADD COLUMN     "whitelist" TEXT[];

-- CreateTable
CREATE TABLE "tent_settings" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "channel_id" TEXT,
    "info_message_id" TEXT,
    "mode" "tent_publicity" NOT NULL DEFAULT 'PUBLIC',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "tent_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tent_hostlist" (
    "tent_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "tent_hostlist_pkey" PRIMARY KEY ("tent_id","user_id")
);

-- CreateTable
CREATE TABLE "tent_whitelist" (
    "tent_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "tent_whitelist_pkey" PRIMARY KEY ("tent_id","user_id")
);

-- CreateTable
CREATE TABLE "tent_blacklist" (
    "tent_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "tent_blacklist_pkey" PRIMARY KEY ("tent_id","user_id")
);

-- AddForeignKey
ALTER TABLE "tent_settings" ADD CONSTRAINT "tent_settings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tent_settings" ADD CONSTRAINT "tent_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tent_hostlist" ADD CONSTRAINT "tent_hostlist_tent_id_fkey" FOREIGN KEY ("tent_id") REFERENCES "tent_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tent_hostlist" ADD CONSTRAINT "tent_hostlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tent_whitelist" ADD CONSTRAINT "tent_whitelist_tent_id_fkey" FOREIGN KEY ("tent_id") REFERENCES "tent_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tent_whitelist" ADD CONSTRAINT "tent_whitelist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tent_blacklist" ADD CONSTRAINT "tent_blacklist_tent_id_fkey" FOREIGN KEY ("tent_id") REFERENCES "tent_settings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tent_blacklist" ADD CONSTRAINT "tent_blacklist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
