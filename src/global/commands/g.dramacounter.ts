import {db, getGuild} from '../utils/knex';
import {DiscordGuilds} from '../@types/pgdb';
import log from '../utils/log';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

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
):Promise<any> {
  log.debug(`[${PREFIX}] starting!`);

  // log.debug(`[${PREFIX}] interaction.guild: ${JSON.stringify(interaction.guild, null, 2)}`);

  if (command === 'get') {
    const guildData = await getGuild(guildId);

    if (guildData.last_drama_at) {
      const dramaDate = guildData.last_drama_at as Date;
      const dramaReason = guildData.drama_reason as string;
      return [dramaReason, dramaDate];
    } else {
      return 'No drama has been reported yet! Be thankful while it lasts...';
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
    return [dramaReason, dramaDate];
  }
}
