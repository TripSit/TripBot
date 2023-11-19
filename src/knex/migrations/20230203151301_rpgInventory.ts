import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create a table that will hold the inventory of a persona
  await knex.schema.createTable('rpgInventory', table => {
    table
      .uuid('id')
      .notNullable()
      .defaultTo(knex.raw('uuid_generate_v4()'))
      .primary();

    table
      .uuid('personaId')
      .notNullable()
      .references('id')
      .inTable('personas');

    table
      .text('label')
      .notNullable();

    table
      .text('value')
      .notNullable();

    table
      .text('description')
      .notNullable();

    table
      .integer('quantity')
      .notNullable();

    table
      .integer('weight')
      .notNullable();

    table
      .integer('cost')
      .notNullable();

    table
      .boolean('equipped')
      .notNullable();

    table
      .boolean('consumable')
      .notNullable();

    table
      .string('effect')
      .notNullable();

    table
      .string('effectValue')
      .notNullable();

    table
      .string('emoji')
      .notNullable();

    table
      .timestamp('createdAt')
      .notNullable()
      .defaultTo(knex.fn.now());

    table.unique(['personaId', 'value']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('rpgInventory');
}
