import {
  TextChannel,
  Guild,
} from 'discord.js';
import { ErrorEvent } from '../@types/eventDef';

const F = f(__filename);

export const error: ErrorEvent = {
  name: 'error',
  async execute(errorObj) {
    log.error(F, `Client error ${JSON.stringify(error, null, 2)}`);
    // log.error(F, `errorObj.name: ${errorObj.name}`);
    // log.error(F, `errorObj.message: ${errorObj.message}`);
    log.error(F, `ERROR: ${errorObj.stack}`);
    if (env.NODE_ENV === 'production') {
      const botlog = await discordClient.channels.fetch(env.CHANNEL_BOTLOG) as TextChannel;
      const guild = await discordClient.guilds.fetch(env.DISCORD_GUILD_ID) as Guild;
      const tripbotdevrole = await guild.roles.fetch(env.ROLE_TRIPBOTDEV);
      await botlog.send(`Hey ${tripbotdevrole}, I just got an error (error):
      ${errorObj.stack}
      `);
    }
  },
};

export default error;
