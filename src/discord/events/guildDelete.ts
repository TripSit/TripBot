import {
  TextChannel,
} from 'discord.js';
import { parse } from 'path';
import {
  GuildDeleteEvent,
} from '../@types/eventDef';
import { db } from '../../global/utils/knex';
import { DiscordGuilds } from '../../global/@types/pgdb';
import env from '../../global/utils/env.config';
import log from '../../global/utils/log';

const PREFIX = parse(__filename).name;

export default guildDelete;

export const guildDelete: GuildDeleteEvent = {
  name: 'guildDelete',
  async execute(guild) {
  // logger.debug(`[${PREFIX}] starting!`);
    log.info(`[${PREFIX}] Left guild: ${guild.name} (id: ${guild.id})`);
    // logger.debug(`[${PREFIX}] finished!`);

    log.info(`[${PREFIX}] Left guild: ${guild.name} (id: ${guild.id})`);
    await db<DiscordGuilds>('discord_guilds')
      .insert({
        id: guild.id,
        removed_at: new Date(),
      })
      .onConflict('id')
      .merge();

    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    client.guilds.fetch(guild.id).then(guildData => {
      botlog.send(`I just left a guild! I am now in ${client.guilds.cache.size} guilds!
        ${guildData.name} (id: ${guildData.id})
        Member count: ${guildData.memberCount}
        Description: ${guildData.description ? guildData.description : 'No description'}
      `);
    });
  },
};
