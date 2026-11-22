-- When the birthday message was last posted for a member, so a restart cannot wish them twice on the same day.
ALTER TABLE "users" ADD COLUMN "birthday_wished_at" TIMESTAMPTZ(6);
