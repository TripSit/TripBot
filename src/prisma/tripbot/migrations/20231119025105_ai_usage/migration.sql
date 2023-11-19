-- CreateTable
CREATE TABLE "ai_usage" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "images" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
    "usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aiusage_userid_unique" ON "ai_usage"("user_id");

-- AddForeignKey
ALTER TABLE "ai_usage" ADD CONSTRAINT "aiusage_userid_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
