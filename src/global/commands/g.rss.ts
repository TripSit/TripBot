import type { rss } from '@prisma/client';

const F = f(__filename); // eslint-disable-line

/**
 *
 * @return {string}
 */
export async function rssCreate(channelId: string, guildId: string, url: string): Promise<void> {
  // log.debug(F, `rssCreate(${channelId}, ${guildId}, ${url})`);

  await db.rss.upsert({
    create: {
      destination: channelId,
      guild_id: guildId,
      last_post_id: '0000',
      url,
    },
    update: {
      destination: channelId,
      guild_id: guildId,
      last_post_id: '0000',
      url,
    },
    where: {
      guild_id_destination: {
        destination: channelId,
        guild_id: guildId,
      },
    },
  });
}

/**
 *
 * @return {string}
 */
export async function rssDelete(channelId: string, guildId: string): Promise<void> {
  await db.rss.delete({
    where: {
      guild_id_destination: {
        destination: channelId,
        guild_id: guildId,
      },
    },
  });
}

/**
 *
 * @return {string}
 */
export async function rssList(guildId: string): Promise<rss[]> {
  // return rssGet(guildId);
  return db.rss.findMany({
    where: {
      guild_id: guildId,
    },
  });
}
