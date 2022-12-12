import { db, getGuild } from '../utils/knex';
import { DiscordGuilds } from '../@types/pgdb';

const F = f(__filename);

export default dramacounter;

/**
 * Birthday information of a user
 * @param {'get' | 'set'} command
 * @param {string} guildId
 * @param {Date} lastDramaAt
 * @param {string} dramaReason
 * @return {any}
 */
export async function dramacounter(
  command: 'get' | 'set',
  guildId: string,
  lastDramaAt: Date,
  dramaReason: string,
):Promise<Drama> {
  let response = {} as {
    dramaReason: string;
    lastDramaAt: Date;
  };
  if (command === 'get') {
    const guildData = await getGuild(guildId);

    if (guildData.last_drama_at) {
      const lastDramaDate = guildData.last_drama_at as Date;
      const lastDramaReason = guildData.drama_reason as string;
      response = {
        dramaReason: lastDramaReason,
        lastDramaAt: lastDramaDate,
      };
    } else {
      return { dramaReason: null, lastDramaAt: null };
    }
  } else if (command === 'set') {
    await db<DiscordGuilds>('discord_guilds')
      .insert({
        id: guildId,
        drama_reason: dramaReason,
        last_drama_at: lastDramaAt,
      })
      .onConflict('id')
      .merge()
      .returning('*');
    response = { dramaReason, lastDramaAt };
  }

  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}

type Drama = {
  dramaReason: string | null;
  lastDramaAt: Date | null;
};
