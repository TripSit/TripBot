import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('counting', table => {
    table
      .uuid('id')
      .notNullable()
      .defaultTo(knex.raw('uuid_generate_v4()'))
      .primary();

    table
      .text('guildId')
      .notNullable()
      .references('id')
      .inTable('discordGuilds');

    table
      .text('channelId')
      .notNullable();

    table
      .enum('type', [
        'NORMAL',
        'HARDCORE',
        'TOKEN',
      ], {
        useNative: true,
        enumName: 'counting_type',
      })
      .notNullable()
      .defaultTo('NORMAL');

    table
      .integer('currentNumber')
      .notNullable()
      .defaultTo(0);

    table
      .text('currentStakeholders')
      .nullable();

    table
      .text('currentNumberMessageID')
      .notNullable()
      .defaultTo('');

    table
      .timestamp('currentNumberMessageDate')
      .notNullable()
      .defaultTo(knex.fn.now());

    table
      .text('currentNumberMessageAuthor')
      .notNullable()
      .defaultTo('');

    table
      .integer('lastNumber')
      .nullable();

    table
      .text('lastNumberMessageID')
      .nullable();

    table
      .timestamp('lastNumberMessageDate')
      .nullable();

    table
      .text('lastNumberMessageAuthor')
      .nullable();

    table
      .text('lastNumberBrokenBy')
      .nullable();

    table
      .timestamp('lastNumberBrokenDate')
      .nullable();

    table
      .integer('recordNumber')
      .notNullable()
      .defaultTo(0);

    table
      .text('recordNumberMessageID')
      .nullable();

    table
      .timestamp('recordNumberMessageDate')
      .nullable();

    table
      .text('recordNumberMessageAuthor')
      .nullable();

    table
      .text('recordNumberBrokenBy')
      .nullable();

    table
      .timestamp('recordNumberBrokenDate')
      .nullable();

    table.unique(['guildId', 'channelId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('counting');

  await knex.raw(`
    DROP TYPE IF EXISTS counting_type
  `);
}
