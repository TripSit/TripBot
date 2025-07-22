import type { GuildUpdateEvent } from '../@types/eventDef';

const F = f(__filename);

export const guildUpdate: GuildUpdateEvent = {
  async execute(guild) {
    const guildData = await db.discord_guilds.upsert({
      create: {
        id: guild.id,
        joined_at: new Date(),
      },
      update: {},
      where: {
        id: guild.id,
      },
    });

    if (guildData.is_banned) {
      log.info(F, `I'm banned from ${guild.name}, leaving!`);
      await guild.leave();
    }

    // Only run this on TripSit
    if (guild.id !== env.DISCORD_GUILD_ID) {
      return;
    }
    log.info(F, `${guild} was updated`);
  },
  name: 'guildUpdate',
};

export default guildUpdate;
