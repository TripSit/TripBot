import {
  Client,
} from 'discord.js';
import logger from '../../global/utils/logger';
import env from '../../global/utils/env.config';
const PREFIX = require('path').parse(__filename).name;

/**
 * Template
 * @param {Client} client The Client that manages this interaction
 * @return {Promise<void>}
**/
export async function bestOf(client: Client): Promise<void> {
  logger.debug(`[${PREFIX}] starting!`);
  logger.debug(`[${PREFIX}] guildId: ${env.DISCORD_GUILD_ID}`);
  logger.debug(`[${PREFIX}] finished!`);
};
