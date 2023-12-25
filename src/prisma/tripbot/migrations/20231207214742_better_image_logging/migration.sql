/*
  Warnings:

  - You are about to drop the column `images` on the `ai_usage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ai_usage" DROP COLUMN "images";

-- CreateTable
CREATE TABLE "ai_images" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "prompt" TEXT NOT NULL,
    "revised_prompt" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "model" "ai_model" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ai_images" ADD CONSTRAINT "aiimages_userid_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
