import { PrismaClient, rss } from '@prisma/client';

const db = new PrismaClient({ log: ['error', 'info', 'query', 'warn'] });

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
}
