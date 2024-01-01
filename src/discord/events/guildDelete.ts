import {
  TextChannel,
} from 'discord.js';
import {
  GuildDeleteEvent,
} from '../@types/eventDef';

const F = f(__filename);

export const guildDelete: GuildDeleteEvent = {
  name: 'guildDelete',
  async execute(guild) {
    log.info(F, `Left guild: ${guild.name} (id: ${guild.id})`);

    await db.discord_guilds.upsert({
      where: {
        id: guild.id,
      },
      create: {
        id: guild.id,
        removed_at: new Date(),
      },
      update: {
        removed_at: new Date(),
      },
    });

    if (guild.id === '1026942722612924518') return;

    const auditlog = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;
    discordClient.guilds.fetch();
    await auditlog.send(`I just left a guild! I am now in ${discordClient.guilds.cache.size} guilds!
      ${guild.name} (id: ${guild.id})
      Member count: ${guild.memberCount}
      Description: ${guild.description ? guild.description : 'No description'}
    `);
  },
};

export default guildDelete;
