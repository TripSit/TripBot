import knex from 'knex';

import {
  DiscordGuilds,
  DrugNames,
  ExperienceCategory,
  ExperienceType,
  Personas,
  ReactionRoles,
  RpgInventory,
  Rss,
  UserActions,
  UserDrugDoses,
  UserExperience,
  UserReminders,
  Users,
  UserTickets,
  // TicketStatus,
  // DiscordGuilds,
} from '../@types/database.d';
 // eslint-disable-line

const F = f(__filename); // eslint-disable-line

export const db = knex({
  client: 'pg',
  connection: env.POSTGRES_DB_URL,
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
  // log.debug(F, `getUser started with: discordId: ${discordId} | userId: ${userId}`);
  let data = {} as Users | undefined;

  if (env.POSTGRES_DB_URL === undefined) {
    return {
      id: 'abc-123-asdf',
      email: null,
      username: null,
      password_hash: null,
      discord_id: '123456',
      irc_id: null,
      matrix_id: null,
      timezone: 'America/New_York',
      birthday: new Date(),
      roles: null,
      mindset_role: null,
      mindset_role_expires_at: null,
      karma_given: 10,
      karma_received: 20,
      sparkle_points: 30,
      move_points: 40,
      empathy_points: 50,
      discord_bot_ban: false,
      ticket_ban: false,
      last_seen_at: new Date(),
      last_seen_in: null,
      joined_at: new Date(),
      removed_at: null,
    } as Users;
  }

  // log.debug(F, 'Database initialized!');

  if (discordId) {
    data = await db<Users>('users')
      .select('*')
      .where('discord_id', discordId)
      .first();
    // log.debug(F, `data1: ${JSON.stringify(data, null, 2)}`);
    if (data === undefined) {
      [data] = (await db<Users>('users')
        .insert({ discord_id: discordId })
        .returning('*'));
      // log.debug(F, `data2: ${JSON.stringify(data, null, 2)}`);
    }
  }
  if (userId) {
    data = await db<Users>('users')
      .select('*')
      .where('id', userId)
      .first();
    // log.debug(F, `data3: ${JSON.stringify(data, null, 2)}`);
  }

  // log.debug(F, `data4: ${JSON.stringify(data, null, 2)}`);

  return data as Users;
}

/**
 *  Get the Guild's info, or create it if it doesn't exist
 * @param {string} guildId
 */
export async function getGuild(guildId:string) {
// log.debug(F, `getGuild started with: guildId: ${guildId}`);

  if (env.POSTGRES_DB_URL === undefined) {
    return {
      id: 'abc-123-xyz',
      is_banned: false,
      last_drama_at: null,
      drama_reason: null,
      max_online_members: null,
      channel_sanctuary: null,
      channel_general: null,
      channel_tripsit: null,
      channel_tripsitmeta: null,
      channel_applications: null,
      role_needshelp: null,
      role_tripsitter: null,
      role_helper: null,
      role_techhelp: null,
      removed_at: null,
      joined_at: new Date(),
      created_at: new Date(),
    } as DiscordGuilds;
  }

  let data = await db<DiscordGuilds>('discord_guilds')
    .select('*')
    .where('id', guildId)
    .first();
  if (!data) {
    [data] = (await db<DiscordGuilds>('discord_guilds')
      .insert({ id: guildId })
      .returning('*'));
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
):Promise<UserTickets | undefined> {
  log.info(F, `getOpenTicket started with: userId: ${userId} | threadId: ${threadId}`);

  let ticketData = {} as UserTickets | undefined;

  if (env.POSTGRES_DB_URL === undefined) {
    return {
      id: 'abc-123-xyz',
      user_id: '123-abc-xyz',
      description: 'test',
      thread_id: '1234',
      meta_thread_id: null,
      first_message_id: '1234',
      type: 'TRIPSIT',
      status: 'OPEN',
      closed_by: null,
      closed_at: null,
      reopened_by: null,
      reopened_at: null,
      archived_at: new Date(),
      deleted_at: new Date(),
      created_at: new Date(),
    } as UserTickets;
  }

  if (threadId) {
    ticketData = await db<UserTickets>('user_tickets')
      .select('*')
      .where('thread_id', threadId)
      // .where('type', 'TRIPSIT')
      .andWhereNot('status', 'CLOSED')
      .andWhereNot('status', 'RESOLVED')
      .andWhereNot('status', 'DELETED')
      .first();
  }
  if (userId) {
    ticketData = await db<UserTickets>('user_tickets')
      .select('*')
      .where('user_id', userId)
      // .where('type', 'TRIPSIT')
      .andWhereNot('status', 'CLOSED')
      .andWhereNot('status', 'RESOLVED')
      .andWhereNot('status', 'DELETED')
      .first();
  }
  return ticketData;
}

/**
 *  Get reminders
 */
export async function reminderGet(
  userId?: string,
):Promise<UserReminders[]> {
// log.debug(F, `reminderGet started with: userId: ${userId}`);
  if (env.POSTGRES_DB_URL === undefined) {
    return [] as UserReminders[];
  }
  if (userId) {
    return db<UserReminders>('user_reminders')
      .select('*')
      .where('user_id', userId);
  }
  return db<UserReminders>('user_reminders')
    .select('*');
}

/**
 *  Add reminders
 * @param {string | null} userId
 * @param {string | null} threadId
 */
export async function reminderSet(
  reminder: UserReminders,
):Promise<void> {
// log.debug(F, 'reminderSet started');
  if (env.POSTGRES_DB_URL === undefined) return;
  await db<UserReminders>('user_reminders')
    .insert(reminder);
}

/**
 *  Delete reminder
 * @param {string} value
 */
export async function reminderDel(
  id?:string,
  userId?:string,
):Promise<void> {
// log.debug(F, `reminderDel started with: id: ${id}`);
  if (env.POSTGRES_DB_URL === undefined) return;
  if (userId) {
    await db<UserReminders>('user_reminders')
      .where('user_id', userId)
      .del();
  }
  await db<UserReminders>('user_reminders')
    .delete()
    .where('id', id);
}

/**
 *  Get tickets
 */
export async function ticketGet(
  user_id?:string,
):Promise<UserTickets[] | UserTickets | undefined> {
// log.debug(F, 'ticketGet started');
  if (env.POSTGRES_DB_URL === undefined) {
    return [] as UserTickets[];
  }
  if (user_id) {
    return db<UserTickets>('user_tickets')
      .select('*')
      .where('user_id', user_id)
      .where('type', 'TRIPSIT')
      .andWhereNot('status', 'CLOSED')
      .andWhereNot('status', 'RESOLVED')
      .andWhereNot('status', 'DELETED')
      .first();
  }

  return db<UserTickets>('user_tickets')
    .select(
      db.ref('id'),
      db.ref('archived_at'),
      db.ref('status'),
      db.ref('thread_id'),
      db.ref('user_id'),
      db.ref('deleted_at'),
    );
}

/**
 *  Delete ticket
 * @param {string | null} userId
 * @param {string | null} threadId
 */
export async function ticketDel(
  id:string,
):Promise<void> {
// log.debug(F, `ticketDel started with: id: ${id}`);
  if (env.POSTGRES_DB_URL === undefined) return;
  await db<UserTickets>('user_reminders')
    .delete()
    .where('id', id);
}

/**
 *  Update ticket
 * @param {string | null} userId
 * @param {string | null} threadId
 */
export async function ticketUpdate(
  value:UserTickets,
):Promise<void> {
  // log.debug(F, `ticketUpdate started with: value: ${JSON.stringify(value)}`);
  if (env.POSTGRES_DB_URL === undefined) return;
  await db<UserTickets>('user_tickets')
    .insert(value)
    .onConflict('id')
    .merge();
}

/**
 *  Update ticket
 * @param {string | null} userId
 * @param {string | null} threadId
 */
export async function usersGetMindsets():Promise<Users[]> {
// log.debug(F, 'usersGetMindsets started');
  if (env.POSTGRES_DB_URL === undefined) {
    return [] as Users[];
  }
  return db<Users>('users')
    .select('*')
    .whereNotNull('mindset_role_expires_at');
}

export async function usersUpdate(
  value:Users,
):Promise<void> {
// log.debug(F, `usersUpdate started with: value: ${value}`);
  if (env.POSTGRES_DB_URL === undefined) return;
  await db<Users>('users')
    .insert(value)
    .onConflict('discord_id')
    .merge();
}

export async function guildUpdate(
  value:DiscordGuilds,
):Promise<void> {
// log.debug(F, `guildUpdate started with: value: ${value}`);
  if (env.POSTGRES_DB_URL === undefined) return;
  await db<DiscordGuilds>('discord_guilds')
    .insert(value)
    .onConflict('id')
    .merge();
}

export async function rssGet(
  guildId:string,
):Promise<Rss[]> {
// log.debug(F, 'rssGet started');
  if (env.POSTGRES_DB_URL === undefined) {
    return [] as Rss[];
  }
  return db<Rss>('rss')
    .select('*')
    .where('guild_id', guildId);
}

export async function rssSet(
  value:Rss,
):Promise<void> {
// log.debug(F, 'rssSet started');
  if (env.POSTGRES_DB_URL === undefined) return;
  await db<Rss>('rss')
    .insert(value)
    .onConflict(['guild_id', 'destination'])
    .merge();
}

export async function rssDel(
  guild_id:string,
  destination:string,
):Promise<void> {
// log.debug(F, 'rssDel started');
  if (env.POSTGRES_DB_URL === undefined) return;
  await db<Rss>('rss')
    .where('guild_id', guild_id)
    .andWhere('destination', destination)
    .del();
}

export async function incrementPoint(
  pointType:string,
  userId:string,
  value:number,
):Promise<void> {
// log.debug(F, 'incrementPoint started');
  if (env.POSTGRES_DB_URL === undefined) return;
  await db<Users>('users')
    .increment(pointType, value)
    .where('discord_id', userId)
    .returning('*');
}

export async function incrementKarma(
  pointType:'karma_received' | 'karma_given',
  userId:string,
  value:1 | -1,
):Promise<string[]> {
// log.debug(F, 'incrementKarma started');
  if (env.POSTGRES_DB_URL === undefined) return [];
  return db<Users>('users')
    .increment(pointType, value)
    .where('discord_id', userId)
    .returning(['karma_received', 'karma_given']);
}

export async function reactionroleGet(
  messageId:string,
  reactionId:string,
):Promise<ReactionRoles | undefined> {
// log.debug(F, 'reactionroleGet started');
  if (env.POSTGRES_DB_URL === undefined) return undefined;
  return db<ReactionRoles>('reaction_roles')
    .select('*')
    .where('message_id', messageId)
    .andWhere('reaction_id', reactionId)
    .first();
}

export async function experienceGet(
  limitInput?:number,
  category?:ExperienceCategory,
  type?:ExperienceType,
  userId?:string,
):Promise<UserExperience[]> {
  // log.debug(F,
  // `experienceGet started with: limit: ${limit}, category: ${category}, type: ${type}, userId: ${userId}`);

  const limit = limitInput || 1000000;
  if (env.POSTGRES_DB_URL === undefined) return [];
  if (category) {
    if (type) {
      if (userId) {
        return db<UserExperience>('user_experience')
          .where('user_id', userId)
          .andWhere('category', category)
          .andWhere('type', type)
          .orderBy('total_points', 'desc')
          .limit(limit);
      }
      return db<UserExperience>('user_experience')
        .select('*')
        .where('category', category)
        .andWhere('type', type)
        .orderBy('total_points', 'desc')
        .limit(limit);
    }
    if (userId) {
      return db<UserExperience>('user_experience')
        .where('user_id', userId)
        .andWhere('category', category)
        .orderBy('total_points', 'desc')
        .limit(limit);
    }
    return db<UserExperience>('user_experience')
      .select('*')
      .where('category', category)
      .orderBy('total_points', 'desc')
      .limit(limit);
  }
  if (userId) {
    if (type) {
      return db<UserExperience>('user_experience')
        .select('*')
        .where('user_id', userId)
        .andWhere('type', type)
        .orderBy('total_points', 'desc')
        .limit(limit);
    }
    return db<UserExperience>('user_experience')
      .select('*')
      .where('user_id', userId)
      .orderBy('total_points', 'desc')
      .limit(limit);
  }
  if (type) {
    // return (await db<UserExperience>('user_experience')
    //   .select(db.ref('user_id'))
    //   .where('type', type)
    //   .andWhereNot('category', 'TOTAL')
    //   .andWhereNot('category', 'IGNORED')
    //   .groupBy(['user_id'])
    //   .sum({ total_points: 'total_points' })
    //   .orderBy('total_points', 'desc')
    //   .limit(limit)) as UserExperience[];
    return db<UserExperience>('user_experience')
      .select('*')
      .where('type', type)
      .orderBy('total_points', 'desc')
      .limit(limit);
  }
  return db<UserExperience>('user_experience')
    .select('*')
    .orderBy('total_points', 'desc')
    .limit(limit);
  // return (await db<UserExperience>('user_experience')
  //   .select(db.ref('user_id'))
  //   .whereNot('category', 'TOTAL')
  //   .andWhereNot('category', 'IGNORED')
  //   .groupBy(['user_id'])
  //   .sum({ total_points: 'total_points' })
  //   .orderBy('total_points', 'desc')
  //   .limit(limit)) as UserExperience[];
}

type LeaderboardList = { discord_id: string, total_points: number }[];

export async function experienceGetTop(
  limitInput?:number,
  category?:ExperienceCategory,
  type?:ExperienceType,
):Promise<LeaderboardList> {
// log.debug(F, 'experienceGetTop started');
  if (env.POSTGRES_DB_URL === undefined) return [] as LeaderboardList;
  const limit = limitInput || 1000000;
  if (category) {
    if (type) { // NOSONAR
      return (await db<{ discord_id: string, total_points: number }>('user_experience')
        .join('users', 'users.id', '=', 'user_experience.user_id') // eslint-disable-line sonarjs/no-duplicate-string
        .select(db.ref('users.discord_id')) // eslint-disable-line sonarjs/no-duplicate-string
        .whereNot('user_experience.category', 'TOTAL')// eslint-disable-line sonarjs/no-duplicate-string
        .andWhereNot('user_experience.category', 'IGNORED')
        .andWhere('user_experience.category', category)
        .andWhere('user_experience.type', type)
        .groupBy(['users.discord_id'])
        .sum({ total_points: 'user_experience.total_points' })// eslint-disable-line sonarjs/no-duplicate-string
        .orderBy('total_points', 'desc')
        .limit(limit)) as LeaderboardList;
    }
    return (await db<{ discord_id: string, total_points: number }>('user_experience')
      .join('users', 'users.id', '=', 'user_experience.user_id')
      .select(db.ref('users.discord_id'))
      .whereNot('user_experience.category', 'TOTAL')
      .andWhereNot('user_experience.category', 'IGNORED')
      .andWhere('user_experience.category', category)
      .groupBy(['users.discord_id'])
      .sum({ total_points: 'user_experience.total_points' })
      .orderBy('total_points', 'desc')
      .limit(limit)) as LeaderboardList;
  }
  if (type) {
    return (await db<{ discord_id: string, total_points: number }>('user_experience')
      .join('users', 'users.id', '=', 'user_experience.user_id')
      .select(db.ref('users.discord_id'))
      .whereNot('user_experience.category', 'TOTAL')
      .andWhereNot('user_experience.category', 'IGNORED')
      .andWhere('user_experience.type', type)
      .groupBy(['users.discord_id'])
      .sum({ total_points: 'user_experience.total_points' })
      .orderBy('total_points', 'desc')
      .limit(limit)) as LeaderboardList;
  }
  return (await db<{ discord_id: string, total_points: number }>('user_experience')
    .join('users', 'users.id', '=', 'user_experience.user_id')
    .select(db.ref('users.discord_id'))
    .whereNot('user_experience.category', 'TOTAL')
    .andWhereNot('user_experience.category', 'IGNORED')
    .groupBy(['users.discord_id'])
    .sum({ total_points: 'user_experience.total_points' })
    .orderBy('total_points', 'desc')
    .limit(limit)) as LeaderboardList;
}

export async function experienceDel(
  userId:string,
):Promise<UserExperience[]> {
// log.debug(F, 'experienceDel started');
  if (env.POSTGRES_DB_URL === undefined) return [];
  return db<UserExperience>('user_experience')
    .where('user_id', userId)
    .del();
}

export async function experienceUpdate(
  data:UserExperience,
):Promise<void> {
// log.debug(F, 'experienceUpdate started');
  if (env.POSTGRES_DB_URL === undefined) return;
  await db<UserExperience>('user_experience')
    .insert(data)
    .onConflict(['user_id', 'category', 'type'])
    .merge();
}

export async function idoseGet(
  userId:string,
):Promise<UserDrugDoses[]> {
// log.debug(F, 'idoseGet started');
  if (env.POSTGRES_DB_URL === undefined) return [];
  return db<UserDrugDoses>('user_drug_doses')
    .select('*')
    .where('user_id', userId);
}

export async function idoseSet(
  data:UserDrugDoses,
):Promise<void> {
// log.debug(F, 'idoseSet started');
  if (env.POSTGRES_DB_URL === undefined) return;
  await db<UserDrugDoses>('user_drug_doses')
    .insert(data);
}

export async function idoseDel(
  id?:string,
  userId?:string,
):Promise<UserDrugDoses[]> {
// log.debug(F, 'idoseDel started');
  if (env.POSTGRES_DB_URL === undefined) return [];
  if (userId) {
    return db<UserDrugDoses>('user_drug_doses')
      .where('user_id', userId)
      .del();
  }
  return db<UserDrugDoses>('user_drug_doses')
    .where('id', id)
    .del();
}

export async function drugGet(
  drugId?:string,
  drugName?:string,
):Promise<DrugNames[]> {
// log.debug(F, 'drugGet started');
  if (env.POSTGRES_DB_URL === undefined) return [];
  if (drugName) {
    return db<DrugNames>('drug_names')
      .select('*')
      .where('name', drugName)
      .orWhere('name', drugName.toLowerCase())
      .orWhere('name', drugName.toUpperCase());
  }
  return db<DrugNames>('drug_names')
    .select('*')
    .where('drug_id', drugId)
    .andWhere('is_default', true);
}

export async function useractionsGet(
  userId:string,
  type?:string,
):Promise<UserActions[]> {
// log.debug(F, 'useractionsGet started');
  if (env.POSTGRES_DB_URL === undefined) return [];
  if (type) {
    return db<UserActions>('user_actions')
      .select('*')
      .where('user_id', userId)
      .andWhere('type', type)
      .andWhere('repealed_at', null)
      .orderBy('created_at', 'desc');
  }

  return db<UserActions>('user_actions')
    .select('*')
    .where('user_id', userId)
    .orderBy('created_at', 'desc');
}

export async function useractionsSet(
  data:UserActions,
):Promise<void> {
// log.debug(F, 'useractionsGet started');
  if (env.POSTGRES_DB_URL === undefined) return;
  await db<UserActions>('user_actions')
    .insert(data)
    .onConflict('id')
    .merge();
}

export async function personaGet(
  userId:string,
):Promise<Personas[]> {
// log.debug(F, 'useractionsGet started');
  if (env.POSTGRES_DB_URL === undefined) return [];
  return db<Personas>('personas')
    .select('*')
    .where('user_id', userId)
    .orderBy('created_at', 'desc');
}

export async function personaSet(
  data:Personas,
):Promise<void> {
// log.debug(F, 'useractionsGet started');
  if (env.POSTGRES_DB_URL === undefined) return;
  await db<Personas>('personas')
    .insert(data)
    .onConflict('user_id')
    .merge();
}

export async function inventoryGet(
  personaId:string,
):Promise<RpgInventory[]> {
// log.debug(F, 'useractionsGet started');
  if (env.POSTGRES_DB_URL === undefined) return [];
  return db<RpgInventory>('rpg_inventory')
    .select('*')
    .where('persona_id', personaId);
}

export async function inventorySet(
  data:RpgInventory,
):Promise<void> {
// log.debug(F, 'useractionsGet started');
  if (env.POSTGRES_DB_URL === undefined) return;
  await db<RpgInventory>('rpg_inventory')
    .insert(data)
    .onConflict(['persona_id', 'value'])
    .merge();
}
