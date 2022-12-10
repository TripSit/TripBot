import { Guild, TextChannel } from 'discord.js';
import { env } from './global/utils/env.config';
import { log } from './global/utils/log';
import { discordConnect } from './discord/dscrd'; // eslint-disable-line
import { validateEnv } from './global/utils/env.validate'; // eslint-disable-line
import { runTimer } from './global/utils/timer'; // eslint-disable-line
import { startLog } from './discord/utils/startLog'; // eslint-disable-line

global.bootTime = new Date();

const F = f(__filename);

/**
* Starts everything in the bot.
*/
async function start() {
  log.info(`${F} Initializing service!`);
  if (!validateEnv()) return;

  if (env.DISCORD_CLIENT_TOKEN) {
    discordConnect();
  }

  runTimer();
}

start();

process.on('unhandledRejection', async (error: Error) => {
  log.error(`${F} ERROR: ${error.stack}`);
  if (env.NODE_ENV === 'production') {
    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    const tripsitguild = client.guilds.cache.get(env.DISCORD_GUILD_ID) as Guild;
    const tripbotdevrole = tripsitguild.roles.cache.get(env.ROLE_TRIPBOTDEV);
    await botlog.send(`Hey ${tripbotdevrole}, I just got an error (start):
    ${error.stack}
    `);
  }
});

// Stop the bot when the process is closed (via Ctrl-C).
const destroy = () => {
  // try {
  //   if (global.manager) {
  //     global.manager.teardown();
  //   }
  // } catch (err) {
  //   log.error(`[${PREFIX}] ${err}`);
  // }
  // log.debug(`[${PREFIX}] Gracefully stopping the bot (CTRL + C pressed)`);
  process.exit(0);
};
process.on('SIGINT', destroy);
process.on('SIGTERM', destroy);

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var env:any; // NOSONAR
  // eslint-disable-next-line no-var, vars-on-top
  var startlog:any; // NOSONAR
}

global.env = env;
global.startlog = startLog;
