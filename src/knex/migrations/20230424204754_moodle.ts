import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', table => {
    table.text('moodleId');
  });
}

export async function down(knex: Knex): Promise<void> {
  if (await knex.schema.hasColumn('users', 'moodleId') === true) {
    await knex.schema.alterTable('users', table => {
      table.dropColumn('moodleId');
    });
  }
}
