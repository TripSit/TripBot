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

type LeaderboardList = { discord_id: string, total_points: number }[];

export const db = knex({
  client: 'pg',
  connection: env.POSTGRES_DB_URL,
});

export async function getUser(
  discordId:string | null,
  userId:string | null,
):Promise<Users> {
  // log.debug(F, `getUser started with: discordId: ${discordId} | userId: ${userId}`);
  let data = {} as Users | undefined;

  if (discordId) {
    try {
      data = await db<Users>('users')
        .select('*')
        .where('discord_id', discordId)
        .first();
    } catch (err) {
      log.error(F, `Error getting user: ${err}`);
      log.error(F, `discordId: ${discordId} | userId: ${userId}`);
    }

    // log.debug(F, `data1: ${JSON.stringify(data, null, 2)}`);
    if (data === undefined) {
      try {
        [data] = (await db<Users>('users')
          .insert({ discord_id: discordId })
          .returning('*'));
      // log.debug(F, `data2: ${JSON.stringify(data, null, 2)}`);
      } catch (err) {
        log.error(F, `Error getting user: ${err}`);
        log.error(F, `discordId: ${discordId} | userId: ${userId}`);
      }
    }
  }
  if (userId) {
    try {
      data = await db<Users>('users')
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

  return data as Users;
}

export async function getGuild(guildId:string):Promise<DiscordGuilds> {
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

  let data = {} as DiscordGuilds | undefined;

  try {
    data = await db<DiscordGuilds>('discord_guilds')
      .select('*')
      .where('id', guildId)
      .first();
  } catch (err) {
    log.error(F, `Error getting guild: ${err}`);
    log.error(F, `guildId: ${guildId}`);
  }
  if (!data) {
    try {
      [data] = (await db<DiscordGuilds>('discord_guilds')
        .insert({ id: guildId })
        .returning('*'));
    } catch (err) {
      log.error(F, `Error getting guild: ${err}`);
      log.error(F, `guildId: ${guildId}`);
    }
  }
  return data as DiscordGuilds;
}

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
    try {
      ticketData = await db<UserTickets>('user_tickets')
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
      ticketData = await db<UserTickets>('user_tickets')
        .select('*')
        .where('user_id', userId)
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
    await db<UserReminders>('user_reminders')
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
):Promise<UserTickets[] | UserTickets | undefined> {
// log.debug(F, 'ticketGet started');
  if (env.POSTGRES_DB_URL === undefined) {
    return [] as UserTickets[];
  }
  let tickets = {} as UserTickets[] | UserTickets | undefined;
  if (user_id) {
    try {
      tickets = await db<UserTickets>('user_tickets')
        .select('*')
        .where('user_id', user_id)
        .where('type', 'TRIPSIT')
        .andWhereNot('status', 'CLOSED')
        .andWhereNot('status', 'RESOLVED')
        .andWhereNot('status', 'DELETED')
        .first();
    } catch (err) {
      log.error(F, `Error getting tickets: ${err}`);
      log.error(F, `user_id: ${user_id}`);
    }
  }
  try {
    tickets = await db<UserTickets>('user_tickets')
      .select(
        db.ref('id'),
        db.ref('archived_at'),
        db.ref('status'),
        db.ref('thread_id'),
        db.ref('user_id'),
        db.ref('deleted_at'),
      );
  } catch (err) {
    log.error(F, `Error getting tickets: ${err}`);
    log.error(F, `user_id: ${user_id}`);
  }

  return tickets;
}

export async function ticketDel(
  id:string,
):Promise<void> {
// log.debug(F, `ticketDel started with: id: ${id}`);
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<UserTickets>('user_reminders')
      .delete()
      .where('id', id);
  } catch (err) {
    log.error(F, `Error deleting ticket: ${err}`);
    log.error(F, `id: ${id}`);
  }
}

export async function ticketUpdate(
  value:UserTickets,
):Promise<void> {
  // log.debug(F, `ticketUpdate started with: value: ${JSON.stringify(value)}`);
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<UserTickets>('user_tickets')
      .insert(value)
      .onConflict('id')
      .merge();
  } catch (err) {
    log.error(F, `Error updating ticket: ${err}`);
    log.error(F, `value: ${value}`);
  }
}

export async function usersGetMindsets():Promise<Users[]> {
// log.debug(F, 'usersGetMindsets started');
  if (env.POSTGRES_DB_URL === undefined) {
    return [] as Users[];
  }
  let users = [] as Users[];
  try {
    users = await db<Users>('users')
      .select('*')
      .whereNotNull('mindset_role_expires_at');
  } catch (err) {
    log.error(F, `Error getting users: ${err}`);
  }
  return users;
}

export async function usersUpdate(
  value:Users,
):Promise<void> {
// log.debug(F, `usersUpdate started with: value: ${value}`);
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<Users>('users')
      .insert(value)
      .onConflict('discord_id')
      .merge();
  } catch (err) {
    log.error(F, `Error updating user: ${err}`);
    log.error(F, `value: ${value}`);
  }
}

export async function guildUpdate(
  value:DiscordGuilds,
):Promise<void> {
// log.debug(F, `guildUpdate started with: value: ${value}`);
  if (env.POSTGRES_DB_URL === undefined) return;
  try {
    await db<DiscordGuilds>('discord_guilds')
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
    log.error(F, `value: ${value}`);
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
    await db<Users>('users')
      .increment(pointType, value)
      .where('discord_id', userId)
      .returning('*');
  } catch (err) {
    log.error(F, `Error incrementing point: ${err}`);
    log.error(F, `pointType: ${pointType} | userId: ${userId} | value: ${value}`);
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
    karma = await db<Users>('users')
      .increment(pointType, value)
      .where('discord_id', userId)
      .returning(['karma_received', 'karma_given']);
  } catch (err) {
    log.error(F, `Error incrementing karma: ${err}`);
    log.error(F, `pointType: ${pointType} | userId: ${userId} | value: ${value}`);
  }
  return karma;
}

export async function reactionroleGet(
  messageId:string,
  reactionId:string,
):Promise<ReactionRoles | undefined> {
// log.debug(F, 'reactionroleGet started');
  if (env.POSTGRES_DB_URL === undefined) return undefined;
  let reactionRole = undefined as ReactionRoles | undefined;
  try {
    reactionRole = await db<ReactionRoles>('reaction_roles')
      .select('*')
      .where('message_id', messageId)
      .andWhere('reaction_id', reactionId)
      .first();
  } catch (err) {
    log.error(F, `Error getting reaction role: ${err}`);
    log.error(F, `messageId: ${messageId} | reactionId: ${reactionId}`);
  }
  return reactionRole;
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
  const limit = limitInput || 1000000;
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
      log.error(F, `drugId: ${drugId}`);
      log.error(F, `drugName: ${drugName}`);
    }
  }
  try {
    response = await db<DrugNames>('drug_names')
      .select('*')
      .where('drug_id', drugId)
      .andWhere('is_default', true);
  } catch (err) {
    log.error(F, `Error getting drug: ${err}`);
    log.error(F, `drugId: ${drugId}`);
    log.error(F, `drugName: ${drugName}`);
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
      [data] = (await db<Personas>('users')
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
