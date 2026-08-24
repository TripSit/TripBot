import { rss } from '@db/tripbot';

const F = f(__filename);

/**
 *
 * @return {string}
 */
export async function rssCreate(
  channelId:string,
  guildId:string,
  url:string,
):Promise<void> {
  await db.rss.upsert({
    where: {
      guild_id_destination: {
        guild_id: guildId,
        destination: channelId,
      },
    },
    create: {
      guild_id: guildId,
      url,
      last_post_id: '0000',
      destination: channelId,
    },
    update: {
      guild_id: guildId,
      url,
      last_post_id: '0000',
      destination: channelId,
    },
  });

  log.debug(F, `rssCreate: subscribed guild ${guildId} channel ${channelId} to ${url}`);
}

/**
 *
 * @return {string}
 */
export async function rssList(
  guildId:string,
):Promise<rss[]> {
  // return rssGet(guildId);
  return db.rss.findMany({
    where: {
      guild_id: guildId,
    },
  });
}

/**
 *
 * @return {string}
 */
export async function rssDelete(
  channelId:string,
  guildId:string,
):Promise<void> {
  await db.rss.delete({
    where: {
      guild_id_destination: {
        guild_id: guildId,
        destination: channelId,
      },
    },
  });

  log.debug(F, `rssDelete: removed RSS subscription for guild ${guildId} channel ${channelId}`);
}
