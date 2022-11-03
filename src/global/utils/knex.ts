import env from './env.config';
import knex from 'knex';
import {
  DiscordGuilds,
  Users,
  UserTickets,
  // TicketStatus,
  // DiscordGuilds,
} from '../../global/@types/pgdb.d';

export const db = knex({
  client: 'pg',
  connection: env.POSTGRES_DBURL,
});

/**
 *  Get the User's info, or create it if it doesn't exist
 * @param {string | null} discordId
 * @param {string | null} userId
 */
export async function getUser(
  discordId:string | null,
  userId:string | null,
) {
  let data = {} as Users | undefined;
  if (discordId) {
    let data = await db<Users>('users')
      .select('*')
      .where('discord_id', discordId)
      .first();
    if (!data) {
      data = await db<Users>('users')
        .insert({discord_id: discordId})
        .returning('*')
        .first();
    }
  }
  if (userId) {
    data = await db<Users>('users')
      .select('*')
      .where('id', userId)
      .first();
  }

  return data;
}

/**
 *  Get the Guild's info, or create it if it doesn't exist
 * @param {string} guildId
 */
export async function getGuild(guildId:string) {
  let data = await db<DiscordGuilds>('discord_guilds')
    .select('*')
    .where('id', guildId)
    .first();
  if (!data) {
    data = await db<DiscordGuilds>('discord_guilds')
      .insert({id: guildId})
      .returning('*')
      .first();
  }
  return data;
}

/**
 *  Get open ticket info
 * @param {string | null} userId
 * @param {string | null} threadId
 */
export async function getOpenTicket(
  userId: string | null,
  threadId: string | null,
) {
  let ticketData = {} as UserTickets | undefined;
  if (threadId) {
    ticketData = await db<UserTickets>('user_tickets')
      .select('*')
      .where('thread_id', threadId)
      .where('type', 'TRIPSIT')
      .andWhereNot('status', 'CLOSED')
      .andWhereNot('status', 'RESOLVED')
      .first();
  }
  if (userId) {
    ticketData = await db<UserTickets>('user_tickets')
      .select('*')
      .where('user_id', userId)
      .where('type', 'TRIPSIT')
      .andWhereNot('status', 'CLOSED')
      .andWhereNot('status', 'RESOLVED')
      .first();
  }
  return ticketData;
}
