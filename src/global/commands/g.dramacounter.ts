import {db, getGuild} from '../utils/knex';
import {DiscordGuilds} from '../@types/pgdb';
import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

/**
 * Birthday information of a user
 * @param {'get' | 'set'} command
 * @param {string} guildId
 * @param {Date} dramaDate
 * @param {string} dramaReason
 * @return {any}
 */
export async function dramacounter(
  command: 'get' | 'set',
  guildId: string,
  dramaDate: Date,
  dramaReason: string,
):Promise<drama> {
  let response = {} as {
    dramaReason: string;
    dramaDate: Date;
  };
  if (command === 'get') {
    const guildData = await getGuild(guildId);

    if (guildData.last_drama_at) {
      const dramaDate = guildData.last_drama_at as Date;
      const dramaReason = guildData.drama_reason as string;
      response = {dramaReason, dramaDate};
    } else {
      return {dramaReason: null, dramaDate: null};
    }
  } else if (command === 'set') {
    await db<DiscordGuilds>('discord_guilds')
      .insert({
        id: guildId,
        drama_reason: dramaReason,
        last_drama_at: dramaDate,
      })
      .onConflict('id')
      .merge()
      .returning('*');
    response = {dramaReason, dramaDate};
  }

  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
}

type drama = {
  dramaReason: string | null;
  dramaDate: Date | null;
}
