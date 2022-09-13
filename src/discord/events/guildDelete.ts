import {Guild} from 'discord.js';
import {
  guildEvent,
} from '../@types/eventDef';
import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const guildDelete: guildEvent = {
  name: 'guildDelete',

  async execute(guild: Guild) {
  // logger.debug(`[${PREFIX}] starting!`);
    logger.info(`[${PREFIX}] Left guild: ${guild.name} (id: ${guild.id})`);
  // logger.debug(`[${PREFIX}] finished!`);
  },
};
