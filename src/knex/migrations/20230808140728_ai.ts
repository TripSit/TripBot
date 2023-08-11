import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('aiPersonas', table => {
    table
      .uuid('id')
      .notNullable()
      .defaultTo(knex.raw('uuid_generate_v4()'))
      .primary();

    table
      .text('name')
      .notNullable();

    table
      .enum('ai_model', [
        'GPT-4',
        'GPT-3.5-TURBO',
        'DAVINCI',
        'CURIE',
        'BABBAGE',
        'ADA',
      ], {
        useNative: true,
        enumName: 'ai_model',
      })
      .notNullable();

    table
      .text('prompt')
      .notNullable();

    table
      .float('temperature')
      .nullable();

    table
      .float('top_p')
      .nullable();

    table
      .float('presence_penalty')
      .notNullable();

    table
      .float('frequency_penalty')
      .notNullable();

    table
      .string('logit_bias')
      .nullable();

    table
      .integer('max_tokens')
      .notNullable();

    table
      .integer('total_tokens')
      .notNullable()
      .defaultTo(0);

    table
      .timestamp('createdAt')
      .notNullable()
      .defaultTo(knex.fn.now());

    table
      .uuid('createdBy')
      .notNullable()
      .references('id')
      .inTable('users');

    table.unique(['name']);
  });

  await knex.schema.createTable('aiChannels', table => {
    table
      .uuid('id')
      .notNullable()
      .defaultTo(knex.raw('uuid_generate_v4()'))
      .primary();

    table
      .text('channelId')
      .notNullable();

    table
      .uuid('personaId')
      .notNullable()
      .references('id')
      .inTable('aiPersonas');

    table.unique(['channelId', 'personaId']);
  });

  // Permissions
  await knex.raw('GRANT ALL ON TABLE public.ai_personas TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.ai_channels TO tripbot_discord');
}

export async function down(knex: Knex): Promise<void> {
  // await knex.schema.table('ai_channels', table => {
  //   table.dropForeign('personaId');
  // });
  await knex.schema.dropTableIfExists('aiChannels');
  await knex.schema.dropTableIfExists('aiPersonas');

  await knex.raw('DROP TYPE IF EXISTS "ai_model"');
}
