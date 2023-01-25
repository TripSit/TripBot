import { db } from '../utils/knex';
import { Rss } from '../@types/pgdb';

const F = f(__filename);

/**
 *
 * @return {string}
 */
export async function rssCreate(
  channelId:string,
  guildId:string,
  url:string,
):Promise<string> {
  const response = 'I did thing!';
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);

  await db<Rss>('rss')
    .insert({
      guild_id: guildId,
      url,
      last_post_id: '0000',
      destination: channelId,
    })
    .onConflict(['guild_id', 'destination'])
    .merge();
  return response;
}

/**
 *
 * @return {string}
 */
export async function rssDelete(
  channelId:string,
  guildId:string,
):Promise<string> {
  const result = await db<Rss>('rss')
    .select({
      guild_id: guildId,
      destination: channelId,
    });

  log.debug(F, `result: ${JSON.stringify(result, null, 2)}`);
  return result.toString();
}
