import {
  TextChannel,
  Guild,
} from 'discord.js';
import { ErrorEvent } from '../@types/eventDef';

const F = f(__filename);

export default error;

export const error: ErrorEvent = {
  name: 'error',
  async execute(errorObj) {
    log.error(F, `Client error ${JSON.stringify(error, null, 2)}`);
    // log.error(F, `errorObj.name: ${errorObj.name}`);
    // log.error(F, `errorObj.message: ${errorObj.message}`);
    log.error(F, `ERROR: ${errorObj.stack}`);
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
