import { db } from '../utils/knex';
import { Rss } from '../@types/pgdb';

/**
 *
 * @return {string}
 */
export async function rssCreate(
  channelId:string,
  guildId:string,
  url:string,
):Promise<void> {
  await db<Rss>('rss')
    .insert({
      guild_id: guildId,
      url,
      last_post_id: '0000',
      destination: channelId,
    })
    .onConflict(['guild_id', 'destination'])
    .merge();
}

/**
 *
 * @return {string}
 */
export async function rssList(
  guildId:string,
):Promise<Rss[]> {
  return db<Rss>('rss')
    .select('*')
    .where('guild_id', guildId);
}

/**
 *
 * @return {string}
 */
export async function rssDelete(
  channelId:string,
  guildId:string,
):Promise<void> {
  await db<Rss>('rss')
    .select({
      guild_id: guildId,
      destination: channelId,
    })
    .delete();
}
