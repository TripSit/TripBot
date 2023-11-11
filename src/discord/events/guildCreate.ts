import {
  TextChannel,
} from 'discord.js';
import { PrismaClient } from '@prisma/client';
import {
  GuildCreateEvent,
} from '../@types/eventDef';

const db = new PrismaClient({ log: ['error'] });

const F = f(__filename);

export const guildCreate: GuildCreateEvent = {
  name: 'guildCreate',
  async execute(guild) {
    log.info(F, `Joined guild: ${guild.name} (id: ${guild.id})`);

    const guildData = await db.discord_guilds.upsert({
      where: {
        id: guild.id,
      },
      create: {
        id: guild.id,
        joined_at: new Date(),
      },
      update: {
        joined_at: new Date(),
      },
    });

    if (guildData.is_banned) {
      log.info(F, `I'm banned from ${guild.name}, leaving!`);
      guild.leave();
      return;
    }

    const auditlog = await discordClient.channels.fetch(env.CHANNEL_AUDITLOG) as TextChannel;
    discordClient.guilds.fetch();
    await auditlog.send(`I just joined a guild! I am now in ${discordClient.guilds.cache.size} guilds!
    ${guild.name} (id: ${guild.id})
    Created at: ${guild.createdAt}
    Member count: ${guild.memberCount}
    Description: ${guild.description ? guild.description : 'No description'}
    `);

  // log.debug(F, `finished!`);
  },
};

export default guildCreate;
