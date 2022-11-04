import {Guild} from 'discord.js';
import {
  guildEvent,
} from '../@types/eventDef';
import {db} from '../../global/utils/knex';
import {DiscordGuilds} from '../../global/@types/pgdb';
import log from '../../global/utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const guildDelete: guildEvent = {
  name: 'guildDelete',

  async execute(guild: Guild) {
  // log.debug(`[${PREFIX}] starting!`);
    log.info(`[${PREFIX}] Left guild: ${guild.name} (id: ${guild.id})`);
    await db<DiscordGuilds>('discord_guilds')
      .insert({
        id: guild.id,
        removed_at: new Date(),
      })
      .onConflict('discord_id')
      .merge();
  },
};
