import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', table => {
    table
      .text('lastfmUsername')
      .nullable();
    table
      .boolean('partner')
      .nullable()
      .defaultTo('FALSE');
    table
      .boolean('supporter')
      .nullable()
      .defaultTo('FALSE');
  });

  await knex.schema.alterTable('discordGuilds', table => {
    table
      .boolean('partner')
      .notNullable()
      .defaultTo('FALSE');
    table
      .boolean('supporter')
      .notNullable()
      .defaultTo('FALSE');
    table
      .text('premium_role_ids')
      .nullable();
  });

  await knex.schema.createTable('bridges', table => {
    // Make new bridge table
    table
      .uuid('id')
      .notNullable()
      .defaultTo(knex.raw('uuid_generate_v4()'))
      .primary();

    table
      .text('internal_channel')
      .notNullable();

    table
      .enum('status', [
        'PENDING',
        'ACTIVE',
        'PAUSED',
      ], {
        useNative: true,
        enumName: 'bridge_status',
      })
      .notNullable()
      .defaultTo('PENDING');

    table
      .text('external_channel')
      .notNullable();

    table.unique(['internal_channel', 'external_channel']);
  });

  await knex.schema.alterTable('reactionRoles', table => {
    table
      .text('guildId')
      .notNullable()
      .references('id')
      .inTable('discordGuilds')
      .alter();

    table
      .enum('type', [
        'COLOR',
        'PREMIUM_COLOR',
        'MINDSET',
        'PRONOUN',
        'NOTIFICATION',
        'CUSTOM',
      ], {
        useNative: true,
        enumName: 'reaction_role_type',
      })
      .notNullable()
      .defaultTo('CUSTOM');

    table
      .text('name')
      .notNullable()
      .defaultTo('custom');
  });
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('discordGuilds', 'team_role_id') === true) {
    await knex.schema.alterTable('discordGuilds', table => {
      table.dropColumn('team_role_id');
    });
  }

  if (await knex.schema.hasColumn('discordGuilds', 'premium_role_id') === true) {
    await knex.schema.alterTable('discordGuilds', table => {
      table.dropColumn('premium_role_ids');
    });
    await knex.schema.alterTable('discordGuilds', table => {
      table.dropColumn('team_role_ids');
    });
  }

  await knex.schema.dropTableIfExists('reaction_roles');

  if (await knex.schema.hasColumn('users', 'lastfm_username') === true) {
    await knex.schema.alterTable('users', table => {
      table.dropColumn('lastfm_username');
    });
  }

  if (await knex.schema.hasColumn('users', 'supporter') === true) {
    await knex.schema.alterTable('users', table => {
      table.dropColumn('supporter');
    });
  }

  if (await knex.schema.hasColumn('users', 'partner') === true) {
    await knex.schema.alterTable('users', table => {
      table.dropColumn('partner');
    });
  }

  if (await knex.schema.hasColumn('guilds', 'partner') === true) {
    await knex.schema.alterTable('guilds', table => {
      table.dropColumn('partner');
    });
  }

  if (await knex.schema.hasColumn('guilds', 'supporter') === true) {
    await knex.schema.alterTable('guilds', table => {
      table.dropColumn('supporter');
    });
  }

  await knex.schema.dropTableIfExists('bridges');

  await knex.raw(`
    DROP TYPE IF EXISTS bridge_status
  `);

  await knex.raw(`
    DROP TYPE IF EXISTS reaction_role_type
  `);
}
