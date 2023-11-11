-- CreateEnum
CREATE TYPE "bridge_status" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "counting_type" AS ENUM ('NORMAL', 'HARDCORE', 'TOKEN');

-- CreateEnum
CREATE TYPE "drug_category_type" AS ENUM ('COMMON', 'PSYCHOACTIVE', 'CHEMICAL');

-- CreateEnum
CREATE TYPE "drug_mass_unit" AS ENUM ('MG', 'ML', 'µG', 'G', 'OZ', 'FLOZ');

-- CreateEnum
CREATE TYPE "drug_name_type" AS ENUM ('BRAND', 'COMMON', 'SUBSTITUTIVE', 'SYSTEMATIC');

-- CreateEnum
CREATE TYPE "drug_roa" AS ENUM ('ORAL', 'INSUFFLATED', 'INHALED', 'TOPICAL', 'SUBLINGUAL', 'BUCCAL', 'RECTAL', 'INTRAMUSCULAR', 'INTRAVENOUS', 'SUBCUTANIOUS', 'TRANSDERMAL');

-- CreateEnum
CREATE TYPE "experience_category" AS ENUM ('TOTAL', 'GENERAL', 'TRIPSITTER', 'DEVELOPER', 'TEAM', 'IGNORED');

-- CreateEnum
CREATE TYPE "experience_type" AS ENUM ('TEXT', 'VOICE');

-- CreateEnum
CREATE TYPE "reaction_role_type" AS ENUM ('COLOR', 'PREMIUM_COLOR', 'MINDSET', 'PRONOUN', 'NOTIFICATION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ticket_status" AS ENUM ('OPEN', 'OWNED', 'BLOCKED', 'PAUSED', 'CLOSED', 'RESOLVED', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "ticket_type" AS ENUM ('APPEAL', 'TRIPSIT', 'TECH', 'FEEDBACK');

-- CreateEnum
CREATE TYPE "user_action_type" AS ENUM ('NOTE', 'WARNING', 'FULL_BAN', 'TICKET_BAN', 'DISCORD_BOT_BAN', 'BAN_EVASION', 'UNDERBAN', 'TIMEOUT', 'REPORT', 'KICK', 'HELPER_BAN', 'CONTRIBUTOR_BAN');

-- CreateEnum
CREATE TYPE "appeal_status" AS ENUM ('OPEN', 'RECEIVED', 'ACCEPTED', 'DENIED');

-- CreateEnum
CREATE TYPE "ai_model" AS ENUM ('GPT-4', 'GPT-3.5-TURBO', 'DAVINCI', 'CURIE', 'BABBAGE', 'ADA');

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "bridges" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "internal_channel" TEXT NOT NULL,
    "status" "bridge_status" NOT NULL DEFAULT 'PENDING',
    "external_channel" TEXT NOT NULL,

    CONSTRAINT "bridges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "counting" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "guild_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "type" "counting_type" NOT NULL DEFAULT 'NORMAL',
    "current_number" INTEGER NOT NULL DEFAULT 0,
    "current_stakeholders" TEXT,
    "current_number_message_id" TEXT NOT NULL DEFAULT '',
    "current_number_message_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_number_message_author" TEXT NOT NULL DEFAULT '',
    "last_number" INTEGER,
    "last_number_message_id" TEXT,
    "last_number_message_date" TIMESTAMPTZ(6),
    "last_number_message_author" TEXT,
    "last_number_broken_by" TEXT,
    "last_number_broken_date" TIMESTAMPTZ(6),
    "record_number" INTEGER NOT NULL DEFAULT 0,
    "record_number_message_id" TEXT,
    "record_number_message_date" TIMESTAMPTZ(6),
    "record_number_message_author" TEXT,
    "record_number_broken_by" TEXT,
    "record_number_broken_date" TIMESTAMPTZ(6),

    CONSTRAINT "counting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drugs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "summary" TEXT,
    "psychonaut_wiki_url" TEXT,
    "errowid_experiences_url" TEXT,
    "last_updated_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drugs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knex_migrations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255),
    "batch" INTEGER,
    "migration_time" TIMESTAMPTZ(6),

    CONSTRAINT "knex_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knex_migrations_lock" (
    "index" SERIAL NOT NULL,
    "is_locked" INTEGER,

    CONSTRAINT "knex_migrations_lock_pkey" PRIMARY KEY ("index")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'No Name',
    "class" TEXT NOT NULL DEFAULT 'jobless',
    "species" TEXT NOT NULL DEFAULT 'formless',
    "guild" TEXT NOT NULL DEFAULT 'guildless',
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "trip_token_multiplier" INTEGER NOT NULL DEFAULT 1,
    "last_quest" TIMESTAMPTZ(6),
    "last_dungeon" TIMESTAMPTZ(6),
    "last_raid" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reaction_roles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "guild_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "reaction_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "reaction_role_type" NOT NULL DEFAULT 'CUSTOM',
    "name" TEXT NOT NULL DEFAULT 'custom',

    CONSTRAINT "reaction_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rss" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "guild_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "last_post_id" TEXT NOT NULL,
    "destination" TEXT NOT NULL,

    CONSTRAINT "rss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" VARCHAR(320),
    "username" VARCHAR(320),
    "password_hash" TEXT,
    "discord_id" TEXT,
    "irc_id" TEXT,
    "matrix_id" TEXT,
    "timezone" TEXT,
    "birthday" TIMESTAMPTZ(6),
    "roles" TEXT,
    "mindset_role" TEXT,
    "mindset_role_expires_at" TIMESTAMPTZ(6),
    "karma_given" INTEGER NOT NULL DEFAULT 0,
    "karma_received" INTEGER NOT NULL DEFAULT 0,
    "sparkle_points" INTEGER NOT NULL DEFAULT 0,
    "move_points" INTEGER NOT NULL DEFAULT 0,
    "empathy_points" INTEGER NOT NULL DEFAULT 0,
    "discord_bot_ban" BOOLEAN NOT NULL DEFAULT false,
    "ticket_ban" BOOLEAN NOT NULL DEFAULT false,
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_in" TEXT,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_at" TIMESTAMPTZ(6),
    "mod_thread_id" TEXT,
    "helper_role_ban" BOOLEAN NOT NULL DEFAULT false,
    "contributor_role_ban" BOOLEAN NOT NULL DEFAULT false,
    "lastfm_username" TEXT,
    "partner" BOOLEAN DEFAULT true,
    "supporter" BOOLEAN DEFAULT true,
    "moodle_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discord_guilds" (
    "id" TEXT NOT NULL,
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "last_drama_at" TIMESTAMPTZ(6),
    "drama_reason" TEXT,
    "max_online_members" INTEGER,
    "channel_sanctuary" TEXT,
    "channel_general" TEXT,
    "channel_tripsit" TEXT,
    "channel_tripsitmeta" TEXT,
    "channel_applications" TEXT,
    "role_needshelp" TEXT,
    "role_tripsitter" TEXT,
    "role_helper" TEXT,
    "role_techhelp" TEXT,
    "removed_at" TIMESTAMPTZ(6),
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partner" BOOLEAN NOT NULL DEFAULT true,
    "supporter" BOOLEAN NOT NULL DEFAULT true,
    "premium_role_ids" TEXT,

    CONSTRAINT "discord_guilds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drug_articles" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "drug_id" UUID NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "published_at" TIMESTAMPTZ(6),
    "last_modified_by" UUID NOT NULL,
    "last_modified_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "posted_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drug_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drug_categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "type" "drug_category_type" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drug_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drug_category_drugs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "drug_id" UUID NOT NULL,
    "drug_category_id" UUID NOT NULL,

    CONSTRAINT "drug_category_drugs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drug_names" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "drug_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "type" "drug_name_type" NOT NULL,

    CONSTRAINT "drug_names_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drug_variant_roas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "drug_variant_id" UUID NOT NULL,
    "route" "drug_roa" NOT NULL,
    "dose_threshold" REAL,
    "dose_light" REAL,
    "dose_common" REAL,
    "dose_strong" REAL,
    "dose_heavy" REAL,
    "dose_warning" TEXT,
    "duration_total_min" REAL,
    "duration_total_max" REAL,
    "duration_onset_min" REAL,
    "duration_onset_max" REAL,
    "duration_comeup_min" REAL,
    "duration_comeup_max" REAL,
    "duration_peak_min" REAL,
    "duration_peak_max" REAL,
    "duration_offset_min" REAL,
    "duration_offset_max" REAL,
    "duration_after_effects_min" REAL,
    "duration_after_effects_max" REAL,

    CONSTRAINT "drug_variant_roas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drug_variants" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "drug_id" UUID NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "default" BOOLEAN NOT NULL DEFAULT false,
    "last_updated_by" UUID NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drug_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rpg_inventory" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "persona_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL,
    "cost" INTEGER NOT NULL,
    "equipped" BOOLEAN NOT NULL,
    "consumable" BOOLEAN NOT NULL,
    "effect" VARCHAR(255) NOT NULL,
    "effect_value" VARCHAR(255) NOT NULL,
    "emoji" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rpg_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_actions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "type" "user_action_type" NOT NULL,
    "ban_evasion_related_user" UUID,
    "description" TEXT,
    "internal_note" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "repealed_by" UUID,
    "repealed_at" TIMESTAMPTZ(6),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_drug_doses" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "drug_id" UUID NOT NULL,
    "route" "drug_roa" NOT NULL,
    "dose" REAL NOT NULL,
    "units" "drug_mass_unit" NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_drug_doses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_experience" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "category" "experience_category" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "level_points" INTEGER NOT NULL DEFAULT 0,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_channel" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "experience_type" NOT NULL DEFAULT 'TEXT',

    CONSTRAINT "user_experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reminders" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "reminder_text" TEXT,
    "trigger_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tickets" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "meta_thread_id" TEXT,
    "first_message_id" TEXT NOT NULL,
    "type" "ticket_type" NOT NULL,
    "status" "ticket_status" NOT NULL DEFAULT 'OPEN',
    "closed_by" UUID,
    "closed_at" TIMESTAMPTZ(6),
    "reopened_by" UUID,
    "reopened_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (CURRENT_TIMESTAMP + '1 day'::interval),
    "deleted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT (CURRENT_TIMESTAMP + '7 days'::interval),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appeals" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "guild_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "appeal_number" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "future" TEXT NOT NULL,
    "extra" TEXT,
    "status" "appeal_status" NOT NULL,
    "appeal_message_id" TEXT NOT NULL,
    "response_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reminded_at" TIMESTAMPTZ(6),
    "decided_at" TIMESTAMPTZ(6),

    CONSTRAINT "appeals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_personas" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "ai_model" "ai_model" NOT NULL,
    "prompt" TEXT NOT NULL,
    "temperature" REAL,
    "top_p" REAL,
    "presence_penalty" REAL NOT NULL,
    "frequency_penalty" REAL NOT NULL,
    "logit_bias" VARCHAR(255),
    "max_tokens" INTEGER NOT NULL,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID NOT NULL,

    CONSTRAINT "ai_personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_channels" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "channel_id" TEXT NOT NULL,
    "persona_id" UUID NOT NULL,

    CONSTRAINT "ai_channels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bridges_internal_channel_external_channel_unique" ON "bridges"("internal_channel", "external_channel");

-- CreateIndex
CREATE UNIQUE INDEX "counting_guildid_channelid_unique" ON "counting"("guild_id", "channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "personas_userid_unique" ON "personas"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "reactionroles_roleid_reactionid_unique" ON "reaction_roles"("role_id", "reaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "rss_guildid_destination_unique" ON "rss"("guild_id", "destination");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_unique" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_unique" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_discordid_unique" ON "users"("discord_id");

-- CreateIndex
CREATE UNIQUE INDEX "drugcategories_name_unique" ON "drug_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "rpginventory_personaid_value_unique" ON "rpg_inventory"("persona_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "userexperience_userid_category_type_unique" ON "user_experience"("user_id", "category", "type");

-- CreateIndex
CREATE UNIQUE INDEX "appeals_user_id_guild_id_appeal_number_unique" ON "appeals"("user_id", "guild_id", "appeal_number");

-- CreateIndex
CREATE UNIQUE INDEX "aipersonas_name_unique" ON "ai_personas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "aichannels_channelid_personaid_unique" ON "ai_channels"("channel_id", "persona_id");

-- AddForeignKey
ALTER TABLE "counting" ADD CONSTRAINT "counting_guildid_foreign" FOREIGN KEY ("guild_id") REFERENCES "discord_guilds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drugs" ADD CONSTRAINT "drugs_lastupdatedby_foreign" FOREIGN KEY ("last_updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_userid_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reaction_roles" ADD CONSTRAINT "reactionroles_guildid_foreign" FOREIGN KEY ("guild_id") REFERENCES "discord_guilds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drug_articles" ADD CONSTRAINT "drugarticles_drugid_foreign" FOREIGN KEY ("drug_id") REFERENCES "drugs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drug_articles" ADD CONSTRAINT "drugarticles_lastmodifiedby_foreign" FOREIGN KEY ("last_modified_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drug_articles" ADD CONSTRAINT "drugarticles_postedby_foreign" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drug_category_drugs" ADD CONSTRAINT "drugcategorydrugs_drugcategoryid_foreign" FOREIGN KEY ("drug_category_id") REFERENCES "drug_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drug_category_drugs" ADD CONSTRAINT "drugcategorydrugs_drugid_foreign" FOREIGN KEY ("drug_id") REFERENCES "drugs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drug_names" ADD CONSTRAINT "drugnames_drugid_foreign" FOREIGN KEY ("drug_id") REFERENCES "drugs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drug_variant_roas" ADD CONSTRAINT "drugvariantroas_drugvariantid_foreign" FOREIGN KEY ("drug_variant_id") REFERENCES "drug_variants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drug_variants" ADD CONSTRAINT "drugvariants_drugid_foreign" FOREIGN KEY ("drug_id") REFERENCES "drugs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "drug_variants" ADD CONSTRAINT "drugvariants_lastupdatedby_foreign" FOREIGN KEY ("last_updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rpg_inventory" ADD CONSTRAINT "rpginventory_personaid_foreign" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_actions" ADD CONSTRAINT "useractions_banevasionrelateduser_foreign" FOREIGN KEY ("ban_evasion_related_user") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_actions" ADD CONSTRAINT "useractions_createdby_foreign" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_actions" ADD CONSTRAINT "useractions_repealedby_foreign" FOREIGN KEY ("repealed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_actions" ADD CONSTRAINT "useractions_userid_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_drug_doses" ADD CONSTRAINT "userdrugdoses_drugid_foreign" FOREIGN KEY ("drug_id") REFERENCES "drugs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_drug_doses" ADD CONSTRAINT "userdrugdoses_userid_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_experience" ADD CONSTRAINT "userexperience_userid_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_reminders" ADD CONSTRAINT "userreminders_userid_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_tickets" ADD CONSTRAINT "usertickets_closedby_foreign" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_tickets" ADD CONSTRAINT "usertickets_reopenedby_foreign" FOREIGN KEY ("reopened_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_tickets" ADD CONSTRAINT "usertickets_userid_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_guildid_foreign" FOREIGN KEY ("guild_id") REFERENCES "discord_guilds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_userid_foreign" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_personas" ADD CONSTRAINT "aipersonas_createdby_foreign" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ai_channels" ADD CONSTRAINT "aichannels_personaid_foreign" FOREIGN KEY ("persona_id") REFERENCES "ai_personas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE OR REPLACE FUNCTION create_roles_and_grant_privileges() RETURNS void AS $$
DECLARE
    role_name text;
    roles text[] = ARRAY['tripsit', 'change', 'moonbear', 'tripbot_discord', 'tripbot_readonly', 'tripsit_api', 'uptime'];
    function_name text;
    table_name text;
BEGIN
    FOREACH role_name IN ARRAY roles
    LOOP
        IF EXISTS (SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = role_name) THEN
            RAISE NOTICE 'Role % already exists. Skipping.', role_name;
        ELSE
            EXECUTE 'CREATE ROLE ' || role_name || ' WITH LOGIN PASSWORD ''P@ssw0rd''';
            RAISE NOTICE 'Created Role: %', role_name;
            EXECUTE 'GRANT ALL PRIVILEGES ON DATABASE tripsit TO ' || role_name;
            RAISE NOTICE 'Granted privileges on tripsit database to role: %', role_name;
        END IF;

        -- Check and create uuid-ossp extension if not exists
        -- IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        --     CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        -- END IF;
        
        -- FOR function_name IN (SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace)
        -- LOOP
        --     EXECUTE 'GRANT EXECUTE ON FUNCTION public.' || function_name || '() TO ' || role_name;
        --     RAISE NOTICE 'Granted EXECUTE on function: % to role: %', function_name, role_name;
        -- END LOOP;

        FOR table_name IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
        LOOP
            EXECUTE 'GRANT ALL ON TABLE public.' || table_name || ' TO ' || role_name;
            RAISE NOTICE 'Granted SELECT on table: % to role: %', table_name, role_name;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT create_roles_and_grant_privileges();
