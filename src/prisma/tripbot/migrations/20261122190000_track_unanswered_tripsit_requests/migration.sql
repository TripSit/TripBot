ALTER TABLE "user_tickets"
  ADD COLUMN "response_due_at" TIMESTAMPTZ(6),
  ADD COLUMN "responded_at" TIMESTAMPTZ(6),
  ADD COLUMN "team_reminded_at" TIMESTAMPTZ(6),
  ADD COLUMN "user_reminded_at" TIMESTAMPTZ(6);

CREATE INDEX "user_tickets_thread_id_idx" ON "user_tickets"("thread_id");
