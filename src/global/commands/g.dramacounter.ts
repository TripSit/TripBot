import {db} from '../utils/knex';
import {DiscordGuilds} from '../@types/pgdb';
import logger from '../../global/utils/logger';
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
  logger.debug(`[${PREFIX}] starting!`);

  // logger.debug(`[${PREFIX}] interaction.guild: ${JSON.stringify(interaction.guild, null, 2)}`);

  if (command === 'get') {
    const data = await db
      .select(
        db.ref('drama_date').as('drama_date'),
        db.ref('drama_reason').as('drama_reason'))
      .from<DiscordGuilds>('discord_guilds')
      .where('id', guildId);

    if (data[0]) {
      const dramaDate = data[0].drama_date as Date;
      const dramaReason = data[0].drama_reason as string;
      return [dramaReason, dramaDate];
    } else {
      return 'No drama has been reported yet! Be thankful while it lasts...';
    }
  } else if (command === 'set') {
    await db('discord_guilds')
      .insert({
        id: guildId,
        drama_reason: dramaReason,
        drama_date: dramaDate,
      })
      .onConflict('id')
      .merge()
      .returning('*');
    return [dramaReason, dramaDate];
  }
}
