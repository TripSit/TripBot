import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('personas', table => {
    table
      .uuid('id')
      .notNullable()
      .defaultTo(knex.raw('uuid_generate_v4()'))
      .primary();

    table
      .uuid('userId')
      .notNullable()
      .references('id')
      .inTable('users');

    table
      .text('name')
      .notNullable()
      .defaultTo('No Name');

    table
      .text('class')
      .notNullable()
      .defaultTo('jobless');

    table
      .text('species')
      .notNullable()
      .defaultTo('formless');

    table
      .text('guild')
      .notNullable()
      .defaultTo('guildless');

    table
      .integer('tokens')
      .notNullable()
      .defaultTo(0);

    table
      .integer('tripTokenMultiplier')
      .notNullable()
      .defaultTo(1);

    table
      .timestamp('lastQuest');

    table
      .timestamp('lastDungeon');

    table
      .timestamp('lastRaid');

    table
      .timestamp('createdAt')
      .notNullable()
      .defaultTo(knex.fn.now());

    table.unique(['userId']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('personas');
}
