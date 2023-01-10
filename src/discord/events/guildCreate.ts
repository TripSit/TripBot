import {
  TextChannel,
} from 'discord.js';
import {
  GuildCreateEvent,
} from '../@types/eventDef';
import { db, getGuild } from '../../global/utils/knex';
import { DiscordGuilds } from '../../global/@types/pgdb';

const F = f(__filename);

export default guildCreate;

export const guildCreate: GuildCreateEvent = {
  name: 'guildCreate',
  async execute(guild) {
    log.info(F, `Joined guild: ${guild.name} (id: ${guild.id})`);

    const guildData = await getGuild(guild.id);

    if (guildData.is_banned) {
      log.info(F, `I'm banned from ${guild.name}, leaving!`);
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

    const auditlog = await client.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;
    client.guilds.fetch();
    await auditlog.send(`I just joined a guild! I am now in ${client.guilds.cache.size} guilds!
    ${guild.name} (id: ${guild.id})
    Created at: ${guild.createdAt}
    Member count: ${guild.memberCount}
    Description: ${guild.description ? guild.description : 'No description'}
    `);

  // log.debug(F, `finished!`);
  },
};
