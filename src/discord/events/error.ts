import {
  TextChannel,
} from 'discord.js';
import {errorEvent} from '../@types/eventDef';
import logger from '../../global/utils/logger';
import env from '../../global/utils/env.config';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const error: errorEvent = {
  name: 'error',
  once: false,
  async execute(error: Error):Promise<void> {
    logger.error(`[${PREFIX}] Client error ${JSON.stringify(error, null, 2)}`);
    logger.error(`[${PREFIX}] error.name: ${error.name}`);
    logger.error(`[${PREFIX}] error.message: ${error.message}`);
    logger.error(`[${PREFIX}] error.stack: ${error.stack}`);
    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    const tripsitguild = client.guilds.cache.get(env.DISCORD_GUILD_ID)!;
    const tripbotdevrole = tripsitguild.roles.cache.get(env.ROLE_TRIPBOTDEV);
    botlog.send(`Hey ${tripbotdevrole}, I just got an error:
    ${error.name}
    ${error.message}
    ${error.stack}
    `);
  },
};
