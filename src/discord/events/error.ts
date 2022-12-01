import {
  TextChannel,
  Guild,
} from 'discord.js';
import { parse } from 'path';
import { ErrorEvent } from '../@types/eventDef';
import log from '../../global/utils/log';
import env from '../../global/utils/env.config';

const PREFIX = parse(__filename).name;

export default error;

export const error: ErrorEvent = {
  name: 'error',
  async execute(errorObj) {
    log.error(`[${PREFIX}] Client error ${JSON.stringify(error, null, 2)}`);
    // log.error(`[${PREFIX}] errorObj.name: ${errorObj.name}`);
    // log.error(`[${PREFIX}] errorObj.message: ${errorObj.message}`);
    log.error(`[${PREFIX}] ERROR: ${errorObj.stack}`);
    if (env.NODE_ENV === 'production') {
      const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
      const tripsitguild = client.guilds.cache.get(env.DISCORD_GUILD_ID) as Guild;
      const tripbotdevrole = tripsitguild.roles.cache.get(env.ROLE_TRIPBOTDEV);
      await botlog.send(`Hey ${tripbotdevrole}, I just got an error (error):
      ${errorObj.stack}
      `);
    }
  },
};
