import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', table => {
    table
      .boolean('helperRoleBan')
      .notNullable()
      .defaultTo(false);

    table
      .boolean('contributorRoleBan')
      .notNullable()
      .defaultTo(false);
  });

  await knex.raw("ALTER TYPE user_action_type ADD VALUE 'HELPER_BAN'");
  await knex.raw("ALTER TYPE user_action_type ADD VALUE 'CONTRIBUTOR_BAN'");
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', table => {
    table.dropColumn('helperRoleBan');
    table.dropColumn('contributorRoleBan');
  });

  // Rename all instances of HELPER_Ban to DISCORD_BOT_BAN
  await knex('userActions')
    .where('type', 'HELPER_BAN')
    .update({ type: 'DISCORD_BOT_BAN' });

  // Rename all instances of CONTRIBUTOR_BAN to DISCORD_BOT_BAN
  await knex('userActions')
    .where('type', 'CONTRIBUTOR_BAN')
    .update({ type: 'DISCORD_BOT_BAN' });

  // // Remove the enum values
  // eslint-disable-next-line max-len
  // await knex.raw("CREATE TYPE old_type AS ENUM('NOTE','WARNING','FULL_BAN','TICKET_BAN','DISCORD_BOT_BAN','BAN_EVASION','UNDERBAN','TIMEOUT','REPORT','KICK')");

  // await knex.raw('ALTER TABLE userActions ALTER COLUMN type SET DATA TYPE old_type USING type::text::old_type');

  // await knex.raw('DROP TYPE user_action_type');

  // await knex.raw('ALTER TYPE old_type RENAME TO user_action_type');
}
