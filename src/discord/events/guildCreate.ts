import {
  TextChannel,
} from 'discord.js';
import {
  GuildCreateEvent,
} from '../@types/eventDef';
import { db, getGuild } from '../../global/utils/knex';
import { DiscordGuilds } from '../../global/@types/pgdb';
import env from '../../global/utils/env.config';
import log from '../../global/utils/log';

const PREFIX = require('path').parse(__filename).name;

export default guildCreate;

export const guildCreate: GuildCreateEvent = {
  name: 'guildCreate',
  async execute(guild) {
    log.info(`[${PREFIX}] Joined guild: ${guild.name} (id: ${guild.id})`);

    const guildData = await getGuild(guild.id);

    if (guildData.is_banned) {
      log.info(`[${PREFIX}] I'm banned from ${guild.name}, leaving!`);
      guild.leave();
      return;
    }
    await db<DiscordGuilds>('discord_guilds')
      .insert({
        id: guild.id,
        joined_at: new Date(),
      })
      .onConflict('id')
      .merge();

    const auditlog = client.channels.cache.get(env.CHANNEL_AUDITLOG) as TextChannel;
    await auditlog.send(`I just joined a guild! I am now in ${client.guilds.cache.size} guilds!
    ${guild.name} (id: ${guild.id})
    Created at: ${guild.createdAt}
    Member count: ${guild.memberCount}
    Description: ${guild.description ? guild.description : 'No description'}
    `);

  // log.debug(`[${PREFIX}] finished!`);
  },
};
