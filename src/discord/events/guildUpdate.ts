import {
  GuildUpdateEvent,
} from '../@types/eventDef';

const F = f(__filename);

export const guildUpdate: GuildUpdateEvent = {
  name: 'guildUpdate',
  async execute(guild) {
    const guildData = await db.discord_guilds.upsert({
      where: {
        id: guild.id,
      },
      create: {
        id: guild.id,
        joined_at: new Date(),
      },
      update: {},
    });

    if (guildData.is_banned) {
      log.info(F, `I'm banned from ${guild.name}, leaving!`);
      await guild.leave();
    }

    // Only run this on TripSit
    if (guild.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `${guild} was updated`);
  },
};

export default guildUpdate;
