// Bad things happen if this is not at the start.
require('dotenv').config();
// import {discordConnect} from './discord/discordAPI';
// import {ircConnect} from './irc/ircAPI';
// import {validateEnv} from './global/utils/env.validate';
// import {runTimer} from './discord/utils/timerAPI';
// import {firebaseConnect} from './global/utils/firebaseAPI';
import {webserverConnect} from './webserver/webserverAPI';


import logger from './global/utils/logger';

const PREFIX = require('path').parse(__filename).name;
global.bootTime = new Date();
// const { telegramConnect } = require('./telegram/telegramAPI');

/**
* Starts everything in the bot.
*/
async function start() {
  logger.info(`[${PREFIX}] Starting service!`);
  // if (!validateEnv()) return;
  // await firebaseConnect();

  // await discordConnect();

  // await ircConnect();

  // Telegram breaks on connect =/
  // await telegramConnect();

  // await runTimer();

  await webserverConnect();
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
  logger.info('Bot stopped.');
};

process.on('unhandledRejection', (error: Error) => {
  logger.error(`[${PREFIX}] error.name: ${error.name}`);
  logger.error(`[${PREFIX}] error.message: ${error.message}`);
  logger.error(`[${PREFIX}] error.stack: ${error.stack}`);
});

process.on('SIGINT', destroy);
process.on('SIGTERM', destroy);
