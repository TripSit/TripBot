-- Keep aggregate command totals and each command's most recent use time, but remove per-use rows, guild/channel IDs,
-- and option values.
CREATE TABLE "command_usage_aggregate" (
    "command" TEXT NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "command_usage_aggregate_pkey" PRIMARY KEY ("command")
);

INSERT INTO "command_usage_aggregate" ("command", "usage_count", "last_used_at")
SELECT "command", COUNT(*)::INTEGER, MAX("created_at")
FROM "command_usage"
GROUP BY "command";

DROP TABLE "command_usage_parameter";
DROP TABLE "command_usage";

ALTER TABLE "command_usage_aggregate" RENAME TO "command_usage";

ALTER TABLE "command_usage" RENAME CONSTRAINT "command_usage_aggregate_pkey" TO "command_usage_pkey";
