import { discord_guilds, user_tickets, users } from '@db/tripbot';
import knex from 'knex';

// import {
//   Bridges,
//   Counting,
//   discord_guilds,
//   DrugNames,
//   ExperienceCategory,
//   ExperienceType,
//   Personas,
//   ReactionRoles,
//   RpgInventory,
//   Rss,
//   UserActions,
//   UserDrugDoses,
//   UserExperience,
//   UserReminders,
//   users,
//   user_tickets,
//   // TicketStatus,
//   // discord_guilds,
//   ReactionRoleType,
//   Appeals,
// } from '../@types/database';
 // eslint-disable-line

const F = f(__filename); // eslint-disable-line

type LeaderboardList = { discord_id: string, total_points: number }[];

export const db = knex({
  client: 'pg',
  connection: env.POSTGRES_DB_URL,
});

export async function getUser(
  discordId:string | null,
  matrixId: string | null,
  userId:string | null,
):Promise<users> {
  // log.debug(F, `getUser started with: discordId: ${discordId} | userId: ${userId}`);
  let data = {} as users | undefined;

  if (env.POSTGRES_DB_URL === undefined) {
    return {
      id: 'abc-123-123',
      discord_id: '123-456-xyz',
      discord_bot_ban: false,
    } as users;
  }

  if (discordId) {
    try {
      data = await db<users>('users')
        .select('*')
        .where('discord_id', discordId)
        .first();
    } catch (err) {
      log.error(F, `Error getting user: ${err}`);
      log.error(F, `discordId: ${discordId} | matrixId: ${matrixId} userId: ${userId}`);
    }
  }
  if (matrixId) {
    try {
      data = await db<users>('users')
        .select('*')
        .where('matrix_id', matrixId)
        .first();
    } catch (err) {
      log.error(F, `Error getting user: ${err}`);
      log.error(F, `discordId: ${discordId} | matrixId: ${matrixId} userId: ${userId}`);
    }
  }
  // log.debug(F, `data1: ${JSON.stringify(data, null, 2)}`);
  if (data === undefined) {
    try {
      if (discordId) {
        [data] = (await db<users>('users')
          .insert({ discord_id: discordId })
          .returning('*'));
      }
      if (matrixId) {
        [data] = (await db<users>('users')
          .insert({ matrix_id: matrixId })
          .returning('*'));
      }

      // log.debug(F, `data2: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      log.error(F, `Error inserting user: ${err}`);
      log.error(F, `discordId: ${discordId} | userId: ${userId}`);
    }
  }
  if (userId) {
    try {
      data = await db<users>('users')
        .select('*')
        .where('id', userId)
        .first();
    // log.debug(F, `data3: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      log.error(F, `Error getting user: ${err}`);
      log.error(F, `discordId: ${discordId} | userId: ${userId}`);
    }
  }

  // log.debug(F, `data4: ${JSON.stringify(data, null, 2)}`);

  return data as users;
}

export async function getMoodleUsers():Promise<users[]> {
  // log.debug(F, `getAllUsers started`);
  let data = [] as users[];

  if (env.POSTGRES_DB_URL === undefined) return data;

  try {
    data = await db<users>('users')
      .select('*')
      .whereNot('moodle_id', null);
  } catch (err) {
    log.error(F, `Error getting all users: ${err}`);
  }

  return data;
}

export async function userExists(
  discordId:string | null,
  matrixId:string | null,
  userId:string | null,
):Promise<boolean> {
  return (await getUser(discordId, matrixId, userId) !== undefined);
}

export async function getGuild(
  guildId:string,
):Promise<discord_guilds> {
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
    } as discord_guilds;
  }

  let data = {} as discord_guilds | undefined;

  try {
    data = await db<discord_guilds>('discord_guilds')
      .select('*')
      .where('id', guildId)
      .first();
  } catch (err) {
    log.error(F, `Error getting guild: ${err}`);
    log.error(F, `guildId: ${guildId}`);
  }
  if (!data) {
    try {
      [data] = (await db<discord_guilds>('discord_guilds')
        .insert({ id: guildId })
        .returning('*'));
    } catch (err) {
      log.error(F, `Error getting guild: ${err}`);
      log.error(F, `guildId: ${guildId}`);
    }
  }
  return data as discord_guilds;
}

export async function getOpenTicket(
  userId: string | null,
  threadId: string | null,
):Promise<user_tickets | undefined> {
  log.info(F, `getOpenTicket started with: userId: ${userId} | threadId: ${threadId}`);

  let ticketData = {} as user_tickets | undefined;

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
    } as user_tickets;
  }

  if (threadId) {
    try {
      ticketData = await db<user_tickets>('user_tickets')
        .select('*')
        .where('thread_id', threadId)
        // .where('type', 'TRIPSIT')
        .andWhereNot('status', 'CLOSED')
        .andWhereNot('status', 'RESOLVED')
        .andWhereNot('status', 'DELETED')
        .first();
    } catch (err) {
      log.error(F, `Error getting open ticket: ${err}`);
      log.error(F, `threadId: ${threadId} | userId: ${userId}`);
    }
  }
  if (userId) {
    try {
      ticketData = await db<user_tickets>('user_tickets')
        .select('*')
        .where('user_id', userId)
        // .where('type', 'TRIPSIT')
        // .andWhereNot('status', 'CLOSED')
        // .andWhereNot('status', 'RESOLVED')
        .andWhereNot('status', 'DELETED')
        .first();
    } catch (err) {
      log.error(F, `Error getting open ticket: ${err}`);
      log.error(F, `threadId: ${threadId} | userId: ${userId}`);
    }
  }
  return ticketData;
}

export async function reminderGet(
  userId?: string,
):Promise<UserReminders[]> {
// log.debug(F, `reminderGet started with: userId: ${userId}`);
  if (env.POSTGRES_DB_URL === undefined) {
    return [] as UserReminders[];
  }
  let reminders = [] as UserReminders[];
  if (userId) {
    try {
      reminders = await db<UserReminders>('user_reminders')
        .select('*')
        .where('user_id', userId);
    } catch (err) {
      log.error(F, `Error getting reminders: ${err}`);
      log.error(F, `userId: ${userId}`);
    }
  }
  try {
    reminders = await db<UserReminders>('user_reminders')
      .select('*');
  } catch (err) {
    log.error(F, `Error getting reminders: ${err}`);
    log.error(F, `userId: ${userId}`);
  }

  return reminders;
}

export async function reminderSet(
  reminder: UserReminders,
):Promise<void> {
// log.debug(F, 'reminderSet started');
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<UserReminders>('userReminders')
      .insert(reminder);
  } catch (err) {
    log.error(F, `Error setting reminder: ${err}`);
    log.error(F, `reminder: ${reminder}`);
  }
}

export async function reminderDel(
  id?:string,
  userId?:string,
):Promise<void> {
// log.debug(F, `reminderDel started with: id: ${id}`);
  if (env.POSTGRES_DB_URL === undefined) return;
  if (userId) {
    try {
      await db<UserReminders>('user_reminders')
        .where('user_id', userId)
        .del();
    } catch (err) {
      log.error(F, `Error deleting reminders: ${err}`);
      log.error(F, `userId: ${userId} | id: ${id}`);
    }
  }
  try {
    await db<UserReminders>('user_reminders')
      .delete()
      .where('id', id);
  } catch (err) {
    log.error(F, `Error deleting reminder: ${err}`);
    log.error(F, `userId: ${userId} | id: ${id}`);
  }
}

export async function ticketGet(
  user_id?:string,
  status?:string,
):Promise<user_tickets[]> {
  // log.debug(F, `ticketGet started with user_id: ${user_id}, status: ${status}`);
  if (env.POSTGRES_DB_URL === undefined) {
    return [] as user_tickets[];
  }

  let tickets = [] as user_tickets[];

  if (user_id) {
    if (status) {
      try {
        tickets = await db<user_tickets>('user_tickets')
          .select('*')
          .where('user_id', user_id)
          .where('type', 'TRIPSIT')
          .andWhere('status', status)
          .orderBy('thread_id', 'desc');
      } catch (err) {
        log.error(F, `Error getting tickets: ${err}`);
        log.error(F, `user_id: ${user_id}`);
      }
    } else {
      try {
        tickets = await db<user_tickets>('user_tickets')
          .select('*')
          .where('user_id', user_id)
          .where('type', 'TRIPSIT')
          .orderBy('thread_id', 'desc');
      } catch (err) {
        log.error(F, `Error getting tickets: ${err}`);
        log.error(F, `user_id: ${user_id}`);
      }
    }
  } else if (status) {
    try {
      tickets = await db<user_tickets>('user_tickets')
        .select('*')
        .where('user_id', user_id)
        .where('type', 'TRIPSIT')
        .andWhere('status', status)
        .orderBy('thread_id', 'desc');
    } catch (err) {
      log.error(F, `Error getting tickets: ${err}`);
      log.error(F, `user_id: ${user_id}`);
    }
  } else {
    try {
      tickets = await db<user_tickets>('user_tickets')
        .select('*')
        .orderBy('thread_id', 'desc');
    } catch (err) {
      log.error(F, `Error getting tickets: ${err}`);
      log.error(F, `user_id: ${user_id}`);
    }
  }

  return tickets;
}

export async function ticketDel(
  id:string,
):Promise<void> {
// log.debug(F, `ticketDel started with: id: ${id}`);
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<user_tickets>('user_reminders')
      .delete()
      .where('id', id);
  } catch (err) {
    log.error(F, `Error deleting ticket: ${err}`);
    log.error(F, `id: ${id}`);
  }
}

export async function ticketUpdate(
  value:user_tickets,
):Promise<void> {
  // log.debug(F, `ticketUpdate started with: value: ${JSON.stringify(value)}`);
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<user_tickets>('user_tickets')
      .insert(value)
      .onConflict('id')
      .merge();
  } catch (err) {
    log.error(F, `Error updating ticket: ${err}`);
    log.error(F, `value: ${JSON.stringify(value, null, 2)}`);
  }
}

export async function usersGetMindsets():Promise<users[]> {
// log.debug(F, 'usersGetMindsets started');
  if (env.POSTGRES_DB_URL === undefined) {
    return [] as users[];
  }
  let users = [] as users[];
  try {
    users = await db<users>('users')
      .select('*')
      .whereNotNull('mindset_role_expires_at');
  } catch (err) {
    log.error(F, `Error getting users (mindsets): ${err}`);
  }
  return users;
}

export async function usersUpdate(
  value:users,
):Promise<void> {
// log.debug(F, `usersUpdate started with: value: ${value}`);
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<users>('users')
      .insert(value)
      .onConflict('discord_id')
      .merge();
  } catch (err) {
    log.error(F, `Error updating user: ${err}`);
    log.error(F, `value: ${JSON.stringify(value, null, 2)}`);
  }
}

export async function guildUpdate(
  value:discord_guilds,
):Promise<void> {
// log.debug(F, `guildUpdate started with: value: ${value}`);
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<discord_guilds>('discord_guilds')
      .insert(value)
      .onConflict('id')
      .merge();
  } catch (err) {
    log.error(F, `Error updating guild: ${err}`);
    log.error(F, `value: ${JSON.stringify(value)}`);
  }
}

export async function rssGet(
  guildId:string,
):Promise<Rss[]> {
// log.debug(F, 'rssGet started');
  if (env.POSTGRES_DB_URL === undefined) {
    return [] as Rss[];
  }
  let rss = [] as Rss[];
  try {
    rss = await db<Rss>('rss')
      .select('*')
      .where('guild_id', guildId);
  } catch (err) {
    log.error(F, `Error getting rss: ${err}`);
    log.error(F, `guildId: ${guildId}`);
  }
  return rss;
}

export async function rssSet(
  value:Rss,
):Promise<void> {
// log.debug(F, 'rssSet started');
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<Rss>('rss')
      .insert(value)
      .onConflict(['guild_id', 'destination'])
      .merge();
  } catch (err) {
    log.error(F, `Error setting rss: ${err}`);
    log.error(F, `value: ${JSON.stringify(value, null, 2)}`);
  }
}

export async function rssDel(
  guild_id:string,
  destination:string,
):Promise<void> {
// log.debug(F, 'rssDel started');
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<Rss>('rss')
      .where('guild_id', guild_id)
      .andWhere('destination', destination)
      .del();
  } catch (err) {
    log.error(F, `Error deleting rss: ${err}`);
    log.error(F, `guild_id: ${guild_id} | destination: ${destination}`);
  }
}

export async function incrementPoint(
  pointType:string,
  userId:string,
  value:number,
):Promise<void> {
// log.debug(F, 'incrementPoint started');
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<users>('users')
      .increment(pointType, value)
      .where('discord_id', userId)
      .returning('*');
  } catch (err) {
    log.error(F, `Error incrementing point: ${err}`);
    log.error(F, `pointType: ${pointType} | userId: ${userId} | value: ${JSON.stringify(value, null, 2)}`);
  }
}

export async function incrementKarma(
  pointType:'karma_received' | 'karma_given',
  userId:string,
  value:1 | -1,
):Promise<string[]> {
// log.debug(F, 'incrementKarma started');
  if (env.POSTGRES_DB_URL === undefined) return [];
  let karma = [] as string[];
  try {
    karma = await db<users>('users')
      .increment(pointType, value)
      .where('discord_id', userId)
      .returning(['karma_received', 'karma_given']);
  } catch (err) {
    log.error(F, `Error incrementing karma: ${err}`);
    log.error(F, `pointType: ${pointType} | userId: ${userId} | value: ${JSON.stringify(value, null, 2)}`);
  }
  return karma;
}

export async function experienceGet(
  limitInput?:number,
  category?:ExperienceCategory,
  type?:ExperienceType,
  userId?:string,
):Promise<UserExperience[]> {
  // log.debug(F,
  // `experienceGet started with: limit: ${limit}, category: ${category}, type: ${type}, userId: ${userId}`);

  const limit = limitInput ?? 1000000;
  if (env.POSTGRES_DB_URL === undefined) return [];
  if (category) {
    if (type) {
      if (userId) {
        try {
          return await db<UserExperience>('user_experience')
            .where('user_id', userId)
            .andWhere('category', category)
            .andWhere('type', type)
            .orderBy('total_points', 'desc')
            .limit(limit);
        } catch (err) {
          log.error(F, `Error getting experience: ${err}`);
          log.error(F, `userId: ${userId} | category: ${category} | type: ${type} | limit: ${limit}`);
        }
      }
      try {
        return await db<UserExperience>('user_experience')
          .select('*')
          .where('category', category)
          .andWhere('type', type)
          .orderBy('total_points', 'desc')
          .limit(limit);
      } catch (err) {
        log.error(F, `Error getting experience: ${err}`);
        log.error(F, `userId: ${userId} | category: ${category} | type: ${type} | limit: ${limit}`);
      }
    }
    if (userId) {
      try {
        return await db<UserExperience>('user_experience')
          .where('user_id', userId)
          .andWhere('category', category)
          .orderBy('total_points', 'desc')
          .limit(limit);
      } catch (err) {
        log.error(F, `Error getting experience: ${err}`);
        log.error(F, `userId: ${userId} | category: ${category} | type: ${type} | limit: ${limit}`);
      }
    }
    try {
      return await db<UserExperience>('user_experience')
        .select('*')
        .where('category', category)
        .orderBy('total_points', 'desc')
        .limit(limit);
    } catch (err) {
      log.error(F, `Error getting experience: ${err}`);
      log.error(F, `userId: ${userId} | category: ${category} | type: ${type} | limit: ${limit}`);
    }
  }
  if (userId) {
    if (type) {
      try {
        return await db<UserExperience>('user_experience')
          .select('*')
          .where('user_id', userId)
          .andWhere('type', type)
          .orderBy('total_points', 'desc')
          .limit(limit);
      } catch (err) {
        log.error(F, `Error getting experience: ${err}`);
        log.error(F, `userId: ${userId} | category: ${category} | type: ${type} | limit: ${limit}`);
      }
    }
    try {
      return await db<UserExperience>('user_experience')
        .select('*')
        .where('user_id', userId)
        .orderBy('total_points', 'desc')
        .limit(limit);
    } catch (err) {
      log.error(F, `Error getting experience: ${err}`);
      log.error(F, `userId: ${userId} | category: ${category} | type: ${type} | limit: ${limit}`);
    }
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
    try {
      return await db<UserExperience>('user_experience')
        .select('*')
        .where('type', type)
        .orderBy('total_points', 'desc')
        .limit(limit);
    } catch (err) {
      log.error(F, `Error getting experience: ${err}`);
      log.error(F, `userId: ${userId} | category: ${category} | type: ${type} | limit: ${limit}`);
    }
  }
  let total = [] as UserExperience[];
  try {
    total = await db<UserExperience>('user_experience')
      .select('*')
      .orderBy('total_points', 'desc')
      .limit(limit);
  } catch (err) {
    log.error(F, `Error getting experience: ${err}`);
    log.error(F, `userId: ${userId} | category: ${category} | type: ${type} | limit: ${limit}`);
  }
  return total;
  // return (await db<UserExperience>('user_experience')
  //   .select(db.ref('user_id'))
  //   .whereNot('category', 'TOTAL')
  //   .andWhereNot('category', 'IGNORED')
  //   .groupBy(['user_id'])
  //   .sum({ total_points: 'total_points' })
  //   .orderBy('total_points', 'desc')
  //   .limit(limit)) as UserExperience[];
}

export async function experienceGetTop(
  limitInput?:number,
  category?:ExperienceCategory,
  type?:ExperienceType,
):Promise<LeaderboardList> {
// log.debug(F, 'experienceGetTop started');
  if (env.POSTGRES_DB_URL === undefined) return [] as LeaderboardList;
  const limit = limitInput ?? 1000000;
  if (category) {
    if (type) { // NOSONAR
      try {
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
      } catch (err) {
        log.error(F, `Error getting experience: ${err}`);
        log.error(F, `category: ${category} | type: ${type} | limit: ${limit}`);
      }
    }
    try {
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
    } catch (err) {
      log.error(F, `Error getting experience: ${err}`);
      log.error(F, `category: ${category} | type: ${type} | limit: ${limit}`);
    }
  }
  if (type) {
    try {
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
    } catch (err) {
      log.error(F, `Error getting experience: ${err}`);
      log.error(F, `category: ${category} | type: ${type} | limit: ${limit}`);
    }
  }
  let total = [] as LeaderboardList;
  try {
    total = (await db<{ discord_id: string, total_points: number }>('user_experience')
      .join('users', 'users.id', '=', 'user_experience.user_id')
      .select(db.ref('users.discord_id'))
      .whereNot('user_experience.category', 'TOTAL')
      .andWhereNot('user_experience.category', 'IGNORED')
      .groupBy(['users.discord_id'])
      .sum({ total_points: 'user_experience.total_points' })
      .orderBy('total_points', 'desc')
      .limit(limit)) as LeaderboardList;
  } catch (err) {
    log.error(F, `Error getting experience: ${err}`);
    log.error(F, `category: ${category} | type: ${type} | limit: ${limit}`);
  }
  return total;
}

export async function experienceDel(
  userId:string,
):Promise<UserExperience[]> {
// log.debug(F, 'experienceDel started');
  if (env.POSTGRES_DB_URL === undefined) return [];
  let total = [] as UserExperience[];
  try {
    total = await db<UserExperience>('user_experience')
      .where('user_id', userId)
      .del();
  } catch (err) {
    log.error(F, `Error deleting experience: ${err}`);
    log.error(F, `userId: ${userId}`);
  }
  return total;
}

export async function experienceUpdate(
  data:UserExperience,
):Promise<void> {
// log.debug(F, 'experienceUpdate started');
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<UserExperience>('user_experience')
      .insert(data)
      .onConflict(['user_id', 'category', 'type'])
      .merge();
  } catch (err) {
    log.error(F, `Error updating experience: ${err}`);
    log.error(F, `data: ${JSON.stringify(data)}`);
  }
}

export async function idoseGet(
  userId:string,
):Promise<UserDrugDoses[]> {
// log.debug(F, 'idoseGet started');
  if (env.POSTGRES_DB_URL === undefined) return [];
  const response = [] as UserDrugDoses[];
  try {
    return await db<UserDrugDoses>('user_drug_doses')
      .select('*')
      .where('user_id', userId);
  } catch (err) {
    log.error(F, `Error getting user drug doses: ${err}`);
    log.error(F, `userId: ${userId}`);
  }
  return response;
}

export async function idoseSet(
  data:UserDrugDoses,
):Promise<void> {
// log.debug(F, 'idoseSet started');
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<UserDrugDoses>('user_drug_doses')
      .insert(data);
  } catch (err) {
    log.error(F, `Error setting user drug doses: ${err}`);
    log.error(F, `data: ${JSON.stringify(data)}`);
  }
}

export async function idoseDel(
  id?:string,
  userId?:string,
):Promise<UserDrugDoses[]> {
// log.debug(F, 'idoseDel started');
  if (env.POSTGRES_DB_URL === undefined) return [];
  if (userId) {
    try {
      return await db<UserDrugDoses>('user_drug_doses')
        .where('user_id', userId)
        .del();
    } catch (err) {
      log.error(F, `Error deleting user drug doses: ${err}`);
      log.error(F, `userId: ${userId}`);
    }
  }
  let response = [] as UserDrugDoses[];
  try {
    response = await db<UserDrugDoses>('user_drug_doses')
      .where('id', id)
      .del();
  } catch (err) {
    log.error(F, `Error deleting user drug doses: ${err}`);
    log.error(F, `id: ${id}`);
  }
  return response;
}

export async function drugGet(
  drugId?:string,
  drugName?:string,
):Promise<DrugNames[]> {
  // log.debug(F, 'drugGet started');
  if (env.POSTGRES_DB_URL === undefined) return [];
  let response = [] as DrugNames[];
  if (drugName) {
    try {
      response = await db<DrugNames>('drug_names')
        .select('*')
        .where('name', drugName)
        .orWhere('name', drugName.toLowerCase())
        .orWhere('name', drugName.toUpperCase());
    } catch (err) {
      log.error(F, `Error getting drug: ${err}`);
      log.error(F, `drugId: ${drugId} (should be null)`);
      log.error(F, `drugName: ${drugName}`);
    }
  }
  if (drugId) {
    try {
      response = await db<DrugNames>('drug_names')
        .select('*')
        .where('drug_id', drugId)
        .andWhere('is_default', true);
    } catch (err) {
      log.error(F, `Error getting drug (id): ${err}`);
      log.error(F, `drugId: ${drugId}`);
      log.error(F, `drugName: ${drugName} (should be null)`);
    }
  }

  return response;
}

export async function useractionsGet(
  userId:string,
  type?:string,
):Promise<UserActions[]> {
// log.debug(F, 'useractionsGet started');
  if (env.POSTGRES_DB_URL === undefined) return [];

  let response = [] as UserActions[];
  if (type) {
    try {
      response = await db<UserActions>('user_actions')
        .select('*')
        .where('user_id', userId)
        .andWhere('type', type)
        .andWhere('repealed_at', null)
        .orderBy('created_at', 'desc');
    } catch (err) {
      log.error(F, `Error getting user actions: ${err}`);
      log.error(F, `userId: ${userId}`);
      log.error(F, `type: ${type}`);
    }
  }
  try {
    response = await db<UserActions>('user_actions')
      .select('*')
      .where('user_id', userId)
      .orderBy('created_at', 'desc');
  } catch (err) {
    log.error(F, `Error getting user actions: ${err}`);
    log.error(F, `userId: ${userId}`);
  }

  return response;
}

export async function useractionsSet(
  data:UserActions,
):Promise<void> {
// log.debug(F, 'useractionsGet started');
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<UserActions>('user_actions')
      .insert(data)
      .onConflict('id')
      .merge();
  } catch (err) {
    log.error(F, `Error setting user actions: ${err}`);
    log.error(F, `data: ${JSON.stringify(data)}`);
  }
}

export async function personaGet(
  userId:string,
):Promise<Personas> {
// log.debug(F, 'useractionsGet started');
  if (env.POSTGRES_DB_URL === undefined) {
    return {
      id: 'string',
      user_id: 'string',
      name: 'string',
      class: 'string',
      species: 'string',
      guild: 'string',
      tokens: 0,
      trip_token_multiplier: 0,
      last_quest: null,
      last_dungeon: null,
      last_raid: null,
      created_at: new Date(),
    } as Personas;
  }

  let data = {} as Personas | undefined;

  try {
    data = await db<Personas>('personas')
      .select('*')
      .where('user_id', userId)
      .first();
  } catch (err) {
    log.error(F, `Error getting personas: ${err}`);
    log.error(F, `userId: ${userId}`);
  }

  // log.debug(F, `data1: ${JSON.stringify(data, null, 2)}`);
  if (data === undefined) {
    try {
      [data] = (await db<Personas>('personas')
        .insert({
          user_id: userId,
          tokens: 0,
        })
        .returning('*'));
    // log.debug(F, `data2: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      log.error(F, `Error getting user: ${err}`);
      log.error(F, `userId: ${userId}`);
    }
  }
  return data as Personas;
}

export async function personaSet(
  data:Personas,
):Promise<void> {
// log.debug(F, 'useractionsGet started');
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<Personas>('personas')
      .insert(data)
      .onConflict('user_id')
      .merge();
  } catch (err) {
    log.error(F, `Error setting personas: ${err}`);
    log.error(F, `data: ${JSON.stringify(data)}`);
  }
}

export async function inventoryGet(
  personaId:string,
):Promise<RpgInventory[]> {
// log.debug(F, 'useractionsGet started');
  if (env.POSTGRES_DB_URL === undefined) return [];
  let response = [] as RpgInventory[];
  try {
    response = await db<RpgInventory>('rpg_inventory')
      .select('*')
      .where('persona_id', personaId);
  } catch (err) {
    log.error(F, `Error getting inventory: ${err}`);
    log.error(F, `personaId: ${personaId}`);
  }
  return response;
}

export async function inventorySet(
  data:RpgInventory,
):Promise<void> {
// log.debug(F, 'useractionsGet started');
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<RpgInventory>('rpg_inventory')
      .insert(data)
      .onConflict(['persona_id', 'value'])
      .merge();
  } catch (err) {
    log.error(F, `Error setting inventory: ${err}`);
    log.error(F, `data: ${JSON.stringify(data)}`);
  }
}

export async function inventoryDel(
  personaId:string,
  value:string,
):Promise<void> {
// log.debug(F, 'useractionsGet started');
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<RpgInventory>('rpg_inventory')
      .delete()
      .where('persona_id', personaId)
      .andWhere('value', value);
  } catch (err) {
    log.error(F, `Error deleting inventory: ${err}`);
    log.error(F, `personaId: ${personaId} | value: ${value}`);
  }
}

export async function countingGet(
  channelID:string,
):Promise<Counting | undefined> {
// log.debug(F, 'useractionsGet started');
  if (env.POSTGRES_DB_URL === undefined) return undefined;
  let response = {} as Counting | undefined;
  try {
    response = await db<Counting>('counting')
      .select('*')
      .where('channel_id', channelID)
      .first();
  } catch (err) {
    log.error(F, `Error getting counting: ${err}`);
    log.error(F, `channelID: ${channelID}`);
  }
  return response;
}

export async function countingSet(
  data:Counting,
):Promise<void> {
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<Counting>('counting')
      .insert(data)
      .onConflict(['channel_id', 'guild_id'])
      .merge();
  } catch (err) {
    log.error(F, `Error setting counting: ${err}`);
    log.error(F, `data: ${JSON.stringify(data)}`);
  }
}

async function bridgesGet(
  channelId: string | null,
):Promise<Bridges[]> {
  if (env.POSTGRES_DB_URL === undefined) return [] as Bridges[];
  let data = await db<Bridges>('bridges')
    .select('*')
    .where('internal_channel', channelId);

  if (data.length === 0) {
    data = await db<Bridges>('bridges')
      .select('*')
      .where('external_channel', channelId);
  }

  return data;
}

async function bridgesSet(
  data: Bridges[],
):Promise<void> {
  if (env.POSTGRES_DB_URL === undefined) return;
  data.forEach(async bridge => {
    await db<Bridges>('bridges')
      .insert(bridge)
      .onConflict(['internal_channel', 'external_channel'])
      .merge();
  });
}

async function bridgesDel(
  data: Bridges[],
):Promise<void> {
  if (env.POSTGRES_DB_URL === undefined) return;
  data.forEach(async bridge => {
    await db<Bridges>('bridges')
      .delete()
      .where('id', bridge.id);
  });
}

export async function reactionroleGet(
  guildId:string | null,
  channelId:string | null,
  messageId:string | null,
  type:ReactionRoleType,
):Promise<ReactionRoles[]> {
  if (env.POSTGRES_DB_URL === undefined) return [] as ReactionRoles[];
  // log.debug(F, `
  //   guildId: ${guildId}
  //   channelId: ${channelId}
  //   messageId: ${messageId}
  //   type: ${type}
  // `);
  if (guildId !== null) {
    if (channelId !== null) {
      if (messageId !== null) {
        if (type !== null) {
          return db<ReactionRoles>('reaction_roles')
            .select('*')
            .where('guild_id', guildId)
            .andWhere('channel_id', channelId)
            .andWhere('message_id', messageId)
            .andWhere('type', type);
        }
        return db<ReactionRoles>('reaction_roles')
          .select('*')
          .where('guild_id', guildId)
          .andWhere('channel_id', channelId)
          .andWhere('message_id', messageId);
      }
      if (type !== null) {
        return db<ReactionRoles>('reaction_roles')
          .select('*')
          .where('guild_id', guildId)
          .andWhere('channel_id', channelId)
          .andWhere('type', type);
      }
      return db<ReactionRoles>('reaction_roles')
        .select('*')
        .where('guild_id', guildId)
        .andWhere('channel_id', channelId);
    }
    if (type !== null) {
      return db<ReactionRoles>('reaction_roles')
        .select('*')
        .where('guild_id', guildId)
        .andWhere('type', type);
    }
    return db<ReactionRoles>('reaction_roles')
      .select('*')
      .where('guild_id', guildId);
  }
  return db<ReactionRoles>('reaction_roles')
    .select('*');
}

async function reactionroleSet(
  data: ReactionRoles[],
):Promise<void> {
  if (env.POSTGRES_DB_URL === undefined) return;
  data.forEach(async role => {
    await db<ReactionRoles>('reaction_roles')
      .insert(role);
    // .onConflict(['internal_channel', 'external_channel'])
    // .merge();
  });
}

async function reactionroleDel(
  data: ReactionRoles[],
):Promise<void> {
  if (env.POSTGRES_DB_URL === undefined) return;
  data.forEach(async role => {
    await db<ReactionRoles>('reaction_roles')
      .delete()
      .where('id', role.id);
  });
}

async function appealsGet(
  userId: string,
  guildId: string,
):Promise<Appeals[]> {
  if (env.POSTGRES_DB_URL === undefined) return [] as Appeals[];
  return db<Appeals>('appeals')
    .select('*')
    .where('user_id', userId)
    .andWhere('guild_id', guildId);
}

async function appealsSet(
  data: Appeals[],
):Promise<void> {
  if (env.POSTGRES_DB_URL === undefined) return;
  data.forEach(async appeal => {
    await db<Appeals>('appeals')
      .insert(appeal)
      .onConflict(['user_id', 'guild_id', 'appeal_number'])
      .merge();
  });
}

async function appealsDel(
  data: Appeals[],
):Promise<void> {
  if (env.POSTGRES_DB_URL === undefined) return;
  data.forEach(async appeal => {
    await db<Appeals>('appeals')
      .delete()
      .where('id', appeal.id);
  });
}

export const database = {
  users: {
    get: getUser,
    getMoodleUsers,
    getMindsets: usersGetMindsets,
    set: usersUpdate,
    incrementPoint,
    incrementKarma,
  },
  guilds: {
    get: getGuild,
    set: guildUpdate,
  },
  tickets: {
    getOpen: getOpenTicket,
    get: ticketGet,
    set: ticketUpdate,
    del: ticketDel,
  },
  reminders: {
    get: reminderGet,
    set: reminderSet,
    del: reminderDel,
  },
  rss: {
    get: rssGet,
    set: rssSet,
    del: rssDel,
  },
  reactionRoles: {
    get: reactionroleGet,
    set: reactionroleSet,
    del: reactionroleDel,
  },
  experience: {
    get: experienceGet,
    getTop: experienceGetTop,
    del: experienceDel,
    set: experienceUpdate,
  },
  doses: {
    get: idoseGet,
    set: idoseSet,
    del: idoseDel,
  },
  drugs: {
    get: drugGet,
  },
  actions: {
    get: useractionsGet,
    set: useractionsSet,
  },
  personas: {
    get: personaGet,
    set: personaSet,
  },
  inventory: {
    get: inventoryGet,
    set: inventorySet,
  },
  counting: {
    get: countingGet,
    set: countingSet,
  },
  bridges: {
    get: bridgesGet,
    set: bridgesSet,
    del: bridgesDel,
  },
  appeals: {
    get: appealsGet,
    set: appealsSet,
    del: appealsDel,
  },
};
