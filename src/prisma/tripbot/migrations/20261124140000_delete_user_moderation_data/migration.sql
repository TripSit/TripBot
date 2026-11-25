-- Remove direct user references from moderation and drug knowledge records after privacy deletion.
ALTER TABLE "user_actions" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "user_actions" ALTER COLUMN "created_by" DROP NOT NULL;
ALTER TABLE "drugs" ALTER COLUMN "last_updated_by" DROP NOT NULL;
ALTER TABLE "drug_variants" ALTER COLUMN "last_updated_by" DROP NOT NULL;
ALTER TABLE "drug_articles" ALTER COLUMN "posted_by" DROP NOT NULL;
ALTER TABLE "drug_articles" ALTER COLUMN "last_modified_by" DROP NOT NULL;
