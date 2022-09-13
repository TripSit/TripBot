// Bad things happen if this is not at the start.
import {discordConnect} from './discord/discordAPI';
import {ircConnect} from './irc/ircAPI';
import {validateEnv} from './global/utils/env.validate';
import {runTimer} from './discord/utils/timerAPI';
import {firebaseConnect} from './global/utils/firebaseAPI';
import {webserverConnect} from './webserver/webserverAPI';
import env from './global/utils/env.config';

import logger from './global/utils/logger';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;
global.bootTime = new Date();
// const { telegramConnect } = require('./telegram/telegramAPI');

/**
* Starts everything in the bot.
*/
async function start() {
  logger.info(`[${PREFIX}] Starting service!`);
  if (!validateEnv()) return;
  webserverConnect();
  if (env.NODE_ENV === 'production') {
    if (env.IRC_PASSWORD) {
      ircConnect();
    }
    // if (env.TELEGRAM_TOKEN) {
    //   // Telegram breaks on connect =/
    //   await telegramConnect();
    // }
  }

  if (env.DISCORD_CLIENT_TOKEN) {
    discordConnect();
  }

  if (env.FIREBASE_PRIVATE_KEY_ID) {
    firebaseConnect();
    runTimer();
  }
}

start();

// Stop the bot when the process is closed (via Ctrl-C).
const destroy = () => {
  // try {
  //   if (global.manager) {
  //     global.manager.teardown();
  //   }
  // } catch (err) {
  //   logger.error(`[${PREFIX}] ${err}`);
  // }
  logger.debug(`[${PREFIX}] Gracefully stopping the bot (CTRL + C pressed)`);
  process.exit(0);
};

process.on('unhandledRejection', (error: Error) => {
  logger.error(`[${PREFIX}] error.name: ${error.name}`);
  logger.error(`[${PREFIX}] error.message: ${error.message}`);
  logger.error(`[${PREFIX}] error.stack: ${error.stack}`);
});

process.on('SIGINT', destroy);
process.on('SIGTERM', destroy);
