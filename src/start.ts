import {discordConnect} from './discord/dscrd';
import {validateEnv} from './global/utils/env.validate';
import {runTimer} from './global/utils/timer';
import {webserverConnect} from './webserver/webserverAPI';

import env from './global/utils/env.config';

import log from './global/utils/log';

import {parse} from 'path';
import {Guild, TextChannel} from 'discord.js';
const PREFIX = parse(__filename).name;
global.bootTime = new Date();

/**
* Starts everything in the bot.
*/
async function start() {
  log.info(`[${PREFIX}] Starting service!`);
  if (!validateEnv()) return;
  if (env.NODE_ENV === 'production') {
    webserverConnect();
  }

  if (env.DISCORD_CLIENT_TOKEN) {
    discordConnect();
  }

  runTimer();
}

start();

process.on('unhandledRejection', (error: Error) => {
  log.error(`[${PREFIX}] ERROR: ${error.stack}`);
  if (env.NODE_ENV === 'production') {
    const botlog = client.channels.cache.get(env.CHANNEL_BOTLOG) as TextChannel;
    const tripsitguild = client.guilds.cache.get(env.DISCORD_GUILD_ID) as Guild;
    const tripbotdevrole = tripsitguild.roles.cache.get(env.ROLE_TRIPBOTDEV);
    botlog.send(`Hey ${tripbotdevrole}, I just got an error (start):
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
  log.debug(`[${PREFIX}] Gracefully stopping the bot (CTRL + C pressed)`);
  process.exit(0);
};
process.on('SIGINT', destroy);
process.on('SIGTERM', destroy);
