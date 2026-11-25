-- Permanently purge AI chat usage/history (including unlinked messages), image prompts,
-- personas and chat channel settings. Preserve consent and moderation configuration.
-- Historical Discord AI audit posts and ordinary messages require separate deletion.
BEGIN;

DROP TABLE "ai_message";
DROP TABLE "ai_image";
DROP TABLE "ai_persona";
DROP TABLE "ai_channel";

-- Consent remains for translation; the selected chat persona is no longer used.
ALTER TABLE "ai_info" DROP COLUMN "persona_id";

-- Normally removed by 20260419175925_ai_overhaul; scrub any surviving legacy history columns.
ALTER TABLE "users" DROP COLUMN IF EXISTS "ai_history_google",
DROP COLUMN IF EXISTS "ai_history_openai",
DROP COLUMN IF EXISTS "ai_terms_agree";

-- Remove only retired chat-command statistics, keeping consent controls and translation.
DELETE FROM "command_usage"
WHERE "command" IN ('ai setup', 'ai personas', 'ai settings', 'ai info');

COMMIT;
