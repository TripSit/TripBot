-- AlterTable
ALTER TABLE "users" 
ADD COLUMN "last_helper_activity" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
