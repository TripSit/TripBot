import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('userExperience', table => {
    table.renameColumn('type', 'category');
  });

  await knex.raw(`
    ALTER TYPE experience_type RENAME TO experience_category;
  `);

  await knex.schema.alterTable('userExperience', table => {
    table
      .enum('type', [
        'TEXT',
        'VOICE',
      ], {
        useNative: true,
        enumName: 'experience_type',
      })
      .notNullable()
      .defaultTo('TEXT');
  });

  await knex.schema.alterTable('userExperience', table => {
    table.unique(['userId', 'category', 'type']);
    table.dropUnique(['userId', 'type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('userExperience', table => {
    table.dropUnique(['userId', 'category', 'type']);
    // table.unique(['userId', 'type']);
  });

  await knex.schema.alterTable('userExperience', table => {
    table.dropColumn('type');
  });

  await knex.raw(`
    DROP TYPE IF EXISTS experience_type
  `);

  await knex.raw(`
    ALTER TYPE experience_category RENAME TO experience_type;
  `);

  await knex.schema.alterTable('userExperience', table => {
    table.renameColumn('category', 'type');
  });
}
