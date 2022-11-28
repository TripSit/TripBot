import {
  GuildUpdateEvent,
} from '../@types/eventDef';
import { getGuild } from '../../global/utils/knex';
import log from '../../global/utils/log';

const PREFIX = require('path').parse(__filename).name;

export default guildUpdate;

export const guildUpdate: GuildUpdateEvent = {
  name: 'guildUpdate',
  async execute(guild) {
    const guildData = await getGuild(guild.id);

    if (guildData.is_banned) {
      log.info(`[${PREFIX}] I'm banned from ${guild.name}, leaving!`);
      guild.leave();
    }
  },
};
