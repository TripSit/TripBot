import { rssDel, rssGet, rssSet } from '../utils/knex';
import { Rss } from '../@types/database';

const F = f(__filename); // eslint-disable-line

/**
 *
 * @return {string}
 */
export async function rssCreate(
  channelId:string,
  guildId:string,
  url:string,
):Promise<void> {
  // log.debug(F, `rssCreate(${channelId}, ${guildId}, ${url})`);

  await rssSet({
    guild_id: guildId,
    url,
    last_post_id: '0000',
    destination: channelId,
  } as Rss);
}

/**
 *
 * @return {string}
 */
export async function rssList(
  guildId:string,
):Promise<Rss[]> {
  return rssGet(guildId);
}

/**
 *
 * @return {string}
 */
export async function rssDelete(
  channelId:string,
  guildId:string,
):Promise<void> {
  await rssDel(channelId, guildId);
}
