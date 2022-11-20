import knex from 'knex';
import { parse } from 'path';
import env from './env.config';
import {
  DiscordGuilds,
  Users,
  UserTickets,
  // TicketStatus,
  // DiscordGuilds,
} from '../@types/pgdb.d';
import log from './log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

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
):Promise<Users> {
  // log.info(`[${PREFIX}] getUser started with: discordId: ${discordId} | userId: ${userId}`);
  let data = {} as Users | undefined;

  if (discordId) {
    data = await db<Users>('users')
      .select('*')
      .where('discord_id', discordId)
      .first();
    // log.debug(`[${PREFIX}] data1: ${JSON.stringify(data, null, 2)}`);
    if (data === undefined) {
      [data] = (await db<Users>('users')
        .insert({ discord_id: discordId })
        .returning('*'));
      // log.debug(`[${PREFIX}] data2: ${JSON.stringify(data, null, 2)}`);
    }
  }
  if (userId) {
    data = await db<Users>('users')
      .select('*')
      .where('id', userId)
      .first();
    // log.debug(`[${PREFIX}] data3: ${JSON.stringify(data, null, 2)}`);
  }

  // log.debug(`[${PREFIX}] data4: ${JSON.stringify(data, null, 2)}`);

  return data as Users;
}

/**
 *  Get the Guild's info, or create it if it doesn't exist
 * @param {string} guildId
 */
export async function getGuild(guildId:string) {
  // log.debug(`[${PREFIX}] getGuild started with: guildId: ${guildId}`);
  let data = await db<DiscordGuilds>('discord_guilds')
    .select('*')
    .where('id', guildId)
    .first();
  if (!data) {
    [data] = (await db<DiscordGuilds>('discord_guilds')
      .insert({ id: guildId })
      .returning('*'));
  }
  return data as DiscordGuilds;
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
    // .andWhereNot('status', 'CLOSED')
      .andWhereNot('status', 'RESOLVED')
      .andWhereNot('status', 'DELETED')
      .first();
  }
  if (userId) {
    ticketData = await db<UserTickets>('user_tickets')
      .select('*')
      .where('user_id', userId)
      .where('type', 'TRIPSIT')
    // .andWhereNot('status', 'CLOSED')
      .andWhereNot('status', 'RESOLVED')
      .andWhereNot('status', 'DELETED')
      .first();
  }
  return ticketData;
}

/**
 *  Get reaction roles
 * @param {string | null} userId
 * @param {string | null} threadId
 */
export async function getReactionRoles(
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
