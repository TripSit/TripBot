-- users.last_seen_at was never updated by the bot, so every existing value is just the row's creation time.
-- The retention purge (purgeInactiveUsers) now keys on it, so start the 6-month clock from this migration
-- instead of purging every long-lived account on the first run. Users already scrubbed by /privacy delete
-- (last_seen_at set to 1970) are left alone.
UPDATE "users" SET "last_seen_at" = now() WHERE "last_seen_at" > '1971-01-01';
