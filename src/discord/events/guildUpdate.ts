import {Guild} from 'discord.js';
import {
  guildEvent,
} from '../@types/eventDef';
import {getGuild} from '../../global/utils/knex';
import log from '../../global/utils/log';
const PREFIX = require('path').parse(__filename).name;

export const guildUpdate: guildEvent = {
  name: 'guildUpdate',

  async execute(guild: Guild) {
    // log.debug(`[${PREFIX}] starting!`);

    const guildData = await getGuild(guild.id);

    if (guildData.is_banned) {
      log.info(`[${PREFIX}] I'm banned from ${guild.name}, leaving!`);
      guild.leave();
      return;
    }


    // log.debug(`[${PREFIX}] finished!`);
  },
};
