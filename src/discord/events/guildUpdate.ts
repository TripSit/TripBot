import {
  GuildUpdateEvent,
} from '../@types/eventDef';
import { getGuild } from '../../global/utils/knex';

const F = f(__filename);

export default guildUpdate;

export const guildUpdate: GuildUpdateEvent = {
  name: 'guildUpdate',
  async execute(guild) {
    const guildData = await getGuild(guild.id);

    if (guildData.is_banned) {
      log.info(F, `I'm banned from ${guild.name}, leaving!`);
      guild.leave();
    }

    // Only run this on TripSit
    if (guild.id !== env.DISCORD_GUILD_ID) return;
    log.info(F, `${guild} was updated`);
  },
};
