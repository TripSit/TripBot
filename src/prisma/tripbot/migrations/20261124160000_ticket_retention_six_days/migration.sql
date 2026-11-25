-- Remove Discord references once ticket cleanup deletes the support and metadata threads.
-- Preserve the six-day lifecycle deadline for tickets that existed before this change.
UPDATE "user_tickets"
SET "deleted_at" = "archived_at" + INTERVAL '3 days';

ALTER TABLE "user_tickets"
  ALTER COLUMN "thread_id" DROP NOT NULL,
  ALTER COLUMN "first_message_id" DROP NOT NULL,
  ALTER COLUMN "archived_at" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '3 days'),
  ALTER COLUMN "deleted_at" SET DEFAULT (CURRENT_TIMESTAMP + INTERVAL '6 days');
