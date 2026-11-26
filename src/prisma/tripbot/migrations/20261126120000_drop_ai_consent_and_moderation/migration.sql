-- TripBot has no AI features left, so drop the AI consent timestamps and the per-guild AI moderation thresholds.
DROP TABLE IF EXISTS "ai_info";
DROP TABLE IF EXISTS "ai_moderation";
