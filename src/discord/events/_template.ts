import {Client} from 'discord.js';
import logger from '../../global/utils/logger';
import env from '../../global/utils/env.config';
const PREFIX = require('path').parse(__filename).name;

module.exports = {
  name: 'template',
  async execute(client: Client) {
    logger.debug(`[${PREFIX}] starting!`);
    logger.debug(`[${PREFIX}] guildId: ${env.DISCORD_GUILD_ID}`);
    logger.debug(`[${PREFIX}] finished!`);
  },
};
