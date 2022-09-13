/* eslint-disable no-unused-vars */
import {Client} from 'discord.js';
import {
  clientEvent,
} from '../@types/eventDef';
import logger from '../../global/utils/logger';
import env from '../../global/utils/env.config';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const template: clientEvent = {
  name: 'template',
  once: false,
  async execute(client: Client) {
    logger.debug(`[${PREFIX}] starting!`);
    logger.debug(`[${PREFIX}] guildId: ${env.DISCORD_GUILD_ID}`);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
