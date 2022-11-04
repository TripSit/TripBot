import {Guild} from 'discord.js';
import {
  guildEvent,
} from '../@types/eventDef';
import {db} from '../../global/utils/knex';
import {DiscordGuilds} from '../../global/@types/pgdb';
import log from '../../global/utils/log';
const PREFIX = require('path').parse(__filename).name;

export const guildCreate: guildEvent = {
  name: 'guildCreate',

  async execute(guild: Guild) {
    log.debug(`[${PREFIX}] starting!`);
    log.info(`[${PREFIX}] Joined guild: ${guild.name} (id: ${guild.id})`);

    const data = await db<DiscordGuilds>('discord_guilds')
      .select('*')
      .where('discord_id', guild.id)
      .first();

    if (data) {
      if (data.is_banned) {
        log.info(`[${PREFIX}] I'm banned from ${guild.name}, leaving!`);
        guild.leave();
        return;
      } else {
        await db<DiscordGuilds>('discord_guilds')
          .insert({
            id: guild.id,
            joined_at: new Date(),
          })
          .onConflict('discord_id')
          .merge();
      }
    } else {
      await db<DiscordGuilds>('discord_guilds')
        .insert({
          id: guild.id,
          joined_at: new Date(),
        })
        .onConflict('discord_id')
        .merge();
    }

    log.debug(`[${PREFIX}] finished!`);
  },
};
