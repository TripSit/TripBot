import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('appeals', table => {
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
      .uuid('userId')
      .notNullable()
      .references('id')
      .inTable('users');

    table
      .integer('appealNumber')
      .notNullable();

    table
      .text('reason')
      .notNullable();

    table
      .text('solution')
      .notNullable();

    table
      .text('future')
      .notNullable();

    table
      .text('extra')
      .nullable();

    table
      .enum('status', [
        'OPEN', // Default status for new tickets
        'RECEIVED', // Status for tickets that have been received by the admin team (they click a button)
        'ACCEPTED',
        'DENIED',
      ], {
        useNative: true,
        enumName: 'appeal_status',
      })
      .notNullable();

    table
      .text('appealMessageId')
      .notNullable();

    table
      .text('responseMessage')
      .nullable();

    table
      .timestamp('createdAt')
      .notNullable()
      .defaultTo(knex.fn.now());

    table
      .timestamp('remindedAt')
      .nullable();

    table
      .timestamp('decidedAt')
      .nullable();

    table.unique(['user_id', 'guild_id', 'appeal_number']);
  });

  // Permissions
  // This one is large cuz we didnt do this in the beginning and now we have to do it for every table
  // In the future this wont be so bad
  await knex.raw('GRANT EXECUTE ON FUNCTION public.uuid_generate_v1() TO tripbot_discord');
  await knex.raw('GRANT EXECUTE ON FUNCTION public.uuid_generate_v1mc() TO tripbot_discord');
  await knex.raw('GRANT EXECUTE ON FUNCTION public.uuid_generate_v3(namespace uuid, name text) TO tripbot_discord');
  await knex.raw('GRANT EXECUTE ON FUNCTION public.uuid_generate_v4() TO tripbot_discord');
  await knex.raw('GRANT EXECUTE ON FUNCTION public.uuid_generate_v5(namespace uuid, name text) TO tripbot_discord');
  await knex.raw('GRANT EXECUTE ON FUNCTION public.uuid_nil() TO tripbot_discord');
  await knex.raw('GRANT EXECUTE ON FUNCTION public.uuid_ns_dns() TO tripbot_discord');
  await knex.raw('GRANT EXECUTE ON FUNCTION public.uuid_ns_oid() TO tripbot_discord');
  await knex.raw('GRANT EXECUTE ON FUNCTION public.uuid_ns_url() TO tripbot_discord');
  await knex.raw('GRANT EXECUTE ON FUNCTION public.uuid_ns_x500() TO tripbot_discord');
  await knex.raw('GRANT ALL ON SEQUENCE public.knex_migrations_id_seq TO tripbot_discord');
  await knex.raw('GRANT ALL ON SEQUENCE public.knex_migrations_lock_index_seq TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.appeals TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.bridges TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.counting TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.discord_guilds TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.drug_articles TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.drug_categories TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.drug_category_drugs TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.drug_names TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.drug_variant_roas TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.drug_variants TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.drugs TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.knex_migrations TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.knex_migrations_lock TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.personas TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.reaction_roles TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.rpg_inventory TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.rss TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.user_actions TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.user_drug_doses TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.user_experience TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.user_reminders TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.user_tickets TO tripbot_discord');
  await knex.raw('GRANT ALL ON TABLE public.users TO tripbot_discord');
}
export async function down(knex: Knex): Promise<void> {
  await knex.schema
    .dropTableIfExists('appeals');

  await knex.raw('DROP TYPE IF EXISTS "appeal_status"');
}
