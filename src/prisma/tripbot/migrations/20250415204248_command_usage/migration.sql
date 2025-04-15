-- CreateTable
CREATE TABLE "command_usage" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "command" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
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
ALTER TABLE "command_usage" ADD CONSTRAINT "command_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("discord_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "command_usage_parameter" ADD CONSTRAINT "command_usage_parameter_usage_id_fkey" FOREIGN KEY ("usage_id") REFERENCES "command_usage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
