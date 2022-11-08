import {
  TextChannel,
  Guild,
} from 'discord.js';
import {errorEvent} from '../@types/eventDef';
import log from '../../global/utils/log';
import env from '../../global/utils/env.config';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

export const error: errorEvent = {
  name: 'error',
  async execute(error) {
    log.error(`[${PREFIX}] Client error ${JSON.stringify(error, null, 2)}`);
    // log.error(`[${PREFIX}] error.name: ${error.name}`);
    // log.error(`[${PREFIX}] error.message: ${error.message}`);
    log.error(`[${PREFIX}] ERROR: ${error.stack}`);
    if (env.NODE_ENV === 'production') {
      const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
      const tripsitguild = client.guilds.cache.get(env.DISCORD_GUILD_ID) as Guild;
      const tripbotdevrole = tripsitguild.roles.cache.get(env.ROLE_TRIPBOTDEV);
      botlog.send(`Hey ${tripbotdevrole}, I just got an error (error):
      ${error.stack}
      `);
    }
  },
};
