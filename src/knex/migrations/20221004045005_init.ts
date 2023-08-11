/* eslint-disable no-multi-spaces */
import type { Knex } from 'knex';

const DRUG_ROAS = [
  'ORAL',
  'INSUFFLATED',
  'INHALED',
  'TOPICAL',
  'SUBLINGUAL',
  'BUCCAL',
  'RECTAL',
  'INTRAMUSCULAR',
  'INTRAVENOUS',
  'SUBCUTANIOUS',
  'TRANSDERMAL',
];

const uuidString = 'uuid_generate_v4()';

export async function up(knex: Knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema
    .createTable('users', table => {
      table
        .uuid('id')
        .notNullable()
        .defaultTo(knex.raw(uuidString))
        .primary();

      table
        .string('email', 320)
        .unique();

      table
        .string('username', 320)
        .unique();

      table.text('passwordHash');
      table.text('discordId');// 12312308123787
      table.text('ircId');    // teknos@tripsit/user/teknos
      table.text('matrixId'); // teknos:tripsit.me
      table.text('timezone'); // America/New_York
      table.timestamp('birthday');

      table.text('roles');
      table.text('mindsetRole');
      table.timestamp('mindsetRoleExpiresAt');

      table
        .integer('karmaGiven')
        .unsigned()
        .notNullable()
        .defaultTo(0);

      table
        .integer('karmaReceived')
        .unsigned()
        .notNullable()
        .defaultTo(0);

      table
        .integer('sparklePoints')
        .unsigned()
        .notNullable()
        .defaultTo(0);

      table
        .integer('movePoints')
        .unsigned()
        .notNullable()
        .defaultTo(0);

      table
        .integer('empathyPoints')
        .unsigned()
        .notNullable()
        .defaultTo(0);

      // Should we perhaps have a bans table with expirations and stuff on it?
      table
        .boolean('discordBotBan')
        .notNullable()
        .defaultTo(false);

      table
        .boolean('ticketBan')
        .notNullable()
        .defaultTo(false);

      table
        .timestamp('lastSeenAt')
        .notNullable()
        .defaultTo(knex.fn.now());

      table
        .timestamp('lastSeenIn');

      table
        .timestamp('joinedAt')
        .notNullable()
        .defaultTo(knex.fn.now());

      table
        .timestamp('removedAt');

      table.unique(['discordId']);
    })
    .createTable('userActions', table => { // Better name?
      table
        .uuid('id')
        .notNullable()
        .defaultTo(knex.raw(uuidString))
        .primary();

      table
        .uuid('userId')
        .notNullable()
        .references('id')
        .inTable('users');

      table
        .enum('type', [
          'NOTE',
          'WARNING',
          'FULL_BAN',
          'TICKET_BAN', // Do we really need this much granularity?
          'DISCORD_BOT_BAN',
          'BAN_EVASION',
          'UNDERBAN',
          'TIMEOUT',
          'REPORT',
          'KICK',
        ], {
          useNative: true,
          enumName: 'user_action_type',
        })
        .notNullable();

      table
        .uuid('banEvasionRelatedUser')
        .references('id')
        .inTable('users');

      table
        .text('description')
        .notNullable();

      table.text('internalNote');
      table.timestamp('expiresAt');

      table
        .uuid('repealedBy')
        .references('id')
        .inTable('users');

      table.timestamp('repealedAt');

      table
        .uuid('createdBy')
        .notNullable()
        .references('id')
        .inTable('users');

      table
        .timestamp('createdAt')
        .notNullable()
        .defaultTo(knex.fn.now());
    })
    .createTable('userTickets', table => {
      table
        .uuid('id')
        .notNullable()
        .defaultTo(knex.raw(uuidString))
        .primary();

      table
        .uuid('userId')
        .notNullable()
        .references('id')
        .inTable('users');

      table
        .text('description')
        .notNullable();

      table.text('threadId');
      table.text('metaThreadId');
      table.text('firstMessageId');

      table
        .enum('type', [
          'APPEAL',
          'TRIPSIT',
          'TECH',
          'FEEDBACK',
        ], {
          useNative: true,
          enumName: 'ticket_type',
        })
        .notNullable();

      table
        .enum('status', [
          'OPEN',     // Default status for new tickets
          'OWNED',    // Someone clicked the Own button
          'BLOCKED',  // Ticket is blocked
          'PAUSED',   // Pause button has been clicked
          'CLOSED',   // Closed by team member
          'RESOLVED', // The user clicks the "im good" button
          'ARCHIVED', // The thread has been archived after 24 hours
          'DELETED',  // The thread has been deleted after 7 days
        ], {
          useNative: true,
          enumName: 'ticket_status',
        })
        .notNullable()
        .defaultTo('OPEN');

      table
        .uuid('closedBy')
        .references('id')
        .inTable('users');

      table.timestamp('closedAt'); // Use a trigger for this?

      table
        .uuid('reopenedBy')
        .references('id')
        .inTable('users');

      table.timestamp('reopenedAt'); // Use a trigger for this?

      table
        .timestamp('archivedAt')
        .notNullable()
        .defaultTo(knex.raw('? + ?::INTERVAL', [knex.fn.now(), '1 day']));

      table
        .timestamp('deletedAt')
        .notNullable()
        .defaultTo(knex.raw('? + ?::INTERVAL', [knex.fn.now(), '7 day']));

      table
        .timestamp('createdAt')
        .notNullable()
        .defaultTo(knex.fn.now());
    })
    .createTable('discordGuilds', table => {
      table
        .text('id')
        .notNullable()
        .primary();

      table
        .boolean('isBanned')
        .notNullable()
        .defaultTo(false);

      table.timestamp('lastDramaAt');
      table.text('dramaReason');

      table
        .integer('maxOnlineMembers')
        .unsigned();

      table.text('channelSanctuary');
      table.text('channelGeneral');
      table.text('channelTripsit');
      table.text('channelTripsitmeta');
      table.text('channelApplications');
      table.text('roleNeedshelp');
      table.text('roleTripsitter');
      table.text('roleHelper');
      table.text('roleTechhelp');

      table.timestamp('removedAt');
      table.timestamp('joinedAt')
        .notNullable()
        .defaultTo(knex.fn.now());

      table
        .timestamp('createdAt')
        .notNullable()
        .defaultTo(knex.fn.now());
    })
    .createTable('userExperience', table => {
      table
        .uuid('id')
        .notNullable()
        .defaultTo(knex.raw(uuidString))
        .primary();

      table
        .uuid('userId')
        .notNullable()
        .references('id')
        .inTable('users');

      table
        .enum('type', [
          'TOTAL',
          'GENERAL',
          'TRIPSITTER',
          'DEVELOPER',
          'TEAM',
          'IGNORED',
        ], {
          useNative: true,
          enumName: 'experience_type',
        });

      table
        .integer('level')
        .unsigned()
        .notNullable()
        .defaultTo(0);

      table
        .integer('levelPoints')
        .unsigned()
        .notNullable()
        .defaultTo(0);

      table
        .integer('totalPoints')
        .unsigned()
        .notNullable()
        .defaultTo(0);

      table
        .timestamp('lastMessageAt')
        .notNullable()
        .defaultTo(knex.fn.now());

      table
        .text('lastMessageChannel')
        .notNullable();

      table
        .timestamp('createdAt')
        .notNullable()
        .defaultTo(knex.fn.now());

      table.unique(['id', 'userId', 'type']);
    })
    .createTable('reactionRoles', table => {
      table
        .uuid('id')
        .notNullable()
        .defaultTo(knex.raw(uuidString))
        .primary();

      table
        .text('guildId')
        .notNullable();
      // .references('id')
      // .inTable('discordGuilds');

      table
        .text('channelId')
        .notNullable();

      table
        .text('messageId')
        .notNullable();

      table
        .text('reactionId')
        .notNullable();

      table
        .text('roleId')
        .notNullable();

      table
        .timestamp('createdAt')
        .notNullable()
        .defaultTo(knex.fn.now());

      table.unique(['roleId', 'reactionId']);
    })
    .createTable('drugs', table => {
      table
        .uuid('id')
        .notNullable()
        .defaultTo(knex.raw(uuidString))
        .primary();

      table.text('summary');
      table.text('psychonautWikiUrl');
      table.text('errowidExperiencesUrl');

      table
        .uuid('lastUpdatedBy')
        .notNullable()
        .references('id')
        .inTable('users');

      table
        .timestamp('updatedAt')
        .notNullable()
        .defaultTo(knex.fn.now());

      table
        .timestamp('createdAt')
        .notNullable()
        .defaultTo(knex.fn.now());
    })
    .createTable('drugNames', table => {
      table
        .uuid('id')
        .notNullable()
        .defaultTo(knex.raw(uuidString))
        .primary();

      table
        .uuid('drugId')
        .notNullable()
        .references('id')
        .inTable('drugs')
        .onDelete('CASCADE');

      table
        .text('name')
        .notNullable();

      // TODO: Check constraint
      table
        .boolean('isDefault')
        .notNullable()
        .defaultTo(false);

      table
        .enum('type', [
          'BRAND',
          'COMMON',
          'SUBSTITUTIVE',
          'SYSTEMATIC',
        ], {
          useNative: true,
          enumName: 'drug_name_type',
        })
        .notNullable();
    })
    .createTable('drugArticles', table => {
      table
        .uuid('id')
        .notNullable()
        .defaultTo(knex.raw(uuidString))
        .primary();

      table
        .uuid('drugId')
        .notNullable()
        .references('id')
        .inTable('drugs')
        .onDelete('CASCADE');

      table
        .string('url', 2048)
        .notNullable();

      table
        .text('title')
        .notNullable();

      table.text('description');
      table.timestamp('publishedAt');

      table
        .uuid('lastModifiedBy')
        .notNullable()
        .references('id')
        .inTable('users');

      table
        .timestamp('lastModifiedAt')
        .notNullable()
        .defaultTo(knex.fn.now());

      table
        .uuid('postedBy')
        .notNullable()
        .references('id')
        .inTable('users');

      table
        .timestamp('createdAt')
        .notNullable()
        .defaultTo(knex.fn.now());
    })
    .createTable('drugVariants', table => {
      table
        .uuid('id')
        .notNullable()
        .defaultTo(knex.raw(uuidString))
        .primary();

      table
        .uuid('drugId')
        .notNullable()
        .references('id')
        .inTable('drugs')
        .onDelete('CASCADE');

      table.text('name');
      table.text('description');

      // TODO: Check constraint
      table
        .boolean('default')
        .notNullable()
        .defaultTo(false);

      table
        .uuid('lastUpdatedBy')
        .notNullable()
        .references('id')
        .inTable('users');

      table
        .timestamp('updatedAt')
        .notNullable()
        .defaultTo(knex.fn.now());

      table
        .timestamp('createdAt')
        .notNullable()
        .defaultTo(knex.fn.now());
    })
    .createTable('drugVariantRoas', table => {
      table
        .uuid('id')
        .notNullable()
        .defaultTo(knex.raw(uuidString))
        .primary();

      table
        .uuid('drugVariantId')
        .notNullable()
        .references('id')
        .inTable('drugVariants')
        .onDelete('CASCADE');

      table
        .enum('route', DRUG_ROAS, {
          useNative: true,
          enumName: 'drug_roa',
        })
        .notNullable();

      table.float('doseThreshold');
      table.float('doseLight');
      table.float('doseCommon');
      table.float('doseStrong');
      table.float('doseHeavy');
      table.text('doseWarning');

      table.float('durationTotalMin');
      table.float('durationTotalMax');
      table.float('durationOnsetMin');
      table.float('durationOnsetMax');
      table.float('durationComeupMin');
      table.float('durationComeupMax');
      table.float('durationPeakMin');
      table.float('durationPeakMax');
      table.float('durationOffsetMin');
      table.float('durationOffsetMax');
      table.float('durationAfterEffectsMin');
      table.float('durationAfterEffectsMax');
    })
    .createTable('userDrugDoses', table => {
      table
        .uuid('id')
        .notNullable()
        .defaultTo(knex.raw(uuidString))
        .primary();

      table
        .uuid('userId')
        .notNullable()
        .references('id')
        .inTable('users');

      table
        .uuid('drugId')
        .notNullable()
        .references('id')
        .inTable('drugs');

      table.enum('route', DRUG_ROAS, {
        useNative: true,
        existingType: true,
        enumName: 'drug_roa',
      })
        .notNullable(); // Not sure why we'd want to null this

      table
        .float('dose')
        .unsigned()
        .notNullable();

      table
        .enum('units', [
          'MG',
          'ML',
          'µG',
          'G',
          'OZ',
          'FLOZ',
        ], {
          useNative: true,
          enumName: 'drug_mass_unit',
        })
        .notNullable();

      table
        .timestamp('createdAt')
        .notNullable()
        .defaultTo(knex.fn.now());
    })
    .createTable('userReminders', table => {
      table
        .uuid('id')
        .notNullable()
        .defaultTo(knex.raw(uuidString))
        .primary();

      table
        .uuid('userId')
        .notNullable()
        .references('id')
        .inTable('users');

      table.text('reminderText');

      table
        .timestamp('triggerAt')
        .notNullable();

      table
        .timestamp('createdAt')
        .notNullable()
        .defaultTo(knex.fn.now());
    })
    .createTable('drugCategories', table => {
      table
        .uuid('id')
        .notNullable()
        .defaultTo(knex.raw(uuidString))
        .primary();

      table
        .text('name')
        .notNullable()
        .unique();

      table
        .enum('type', [
          'COMMON',
          'PSYCHOACTIVE',
          'CHEMICAL',
        ], {
          useNative: true,
          enumName: 'drug_category_type',
        })
        .notNullable();

      table
        .timestamp('createdAt')
        .notNullable()
        .defaultTo(knex.fn.now());
    })
    .createTable('drugCategoryDrugs', table => {
      table
        .uuid('id')
        .notNullable()
        .defaultTo(knex.raw(uuidString))
        .primary();

      table
        .uuid('drugId')
        .notNullable()
        .references('id')
        .inTable('drugs')
        .onDelete('CASCADE');

      table
        .uuid('drugCategoryId')
        .notNullable()
        .references('id')
        .inTable('drugCategories')
        .onDelete('CASCADE');
    });
}

export async function down(knex: Knex) {
  await knex.schema
    .dropTableIfExists('drugCategoryDrugs')
    .dropTableIfExists('drugCategories')
    .dropTableIfExists('userReminders')
    .dropTableIfExists('userDrugDoses')
    .dropTableIfExists('drugVariantRoas')
    .dropTableIfExists('drugVariants')
    .dropTableIfExists('drugArticles')
    .dropTableIfExists('drugNames')
    .dropTableIfExists('drugs')
    .dropTableIfExists('reactionRoles')
    .dropTableIfExists('userExperience')
    .dropTableIfExists('discordGuilds')
    .dropTableIfExists('userTickets')
    .dropTableIfExists('userActions')
    .dropTableIfExists('users');

  await knex.raw('DROP TYPE IF EXISTS "drug_category_type"');
  await knex.raw('DROP TYPE IF EXISTS "drug_mass_unit"');
  await knex.raw('DROP TYPE IF EXISTS "drug_roa"');
  await knex.raw('DROP TYPE IF EXISTS "drug_name_type"');
  await knex.raw('DROP TYPE IF EXISTS "experience_type"');
  await knex.raw('DROP TYPE IF EXISTS "ticket_type"');
  await knex.raw('DROP TYPE IF EXISTS "ticket_status"');
  await knex.raw('DROP TYPE IF EXISTS "user_action_type"');

  await knex.raw('DROP EXTENSION IF EXISTS "uuid-ossp"');
}
