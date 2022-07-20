'use strict';

/* eslint-disable no-unused-vars */

const PREFIX = require('path').parse(__filename).name;
const logger = require('./global/utils/logger');
const { discordConnect } = require('./discord/discordAPI');
const { ircConnect } = require('./irc/ircAPI');
const { telegramConnect } = require('./telegram/telegramAPI');
const { firebaseConnect } = require('./global/services/firebaseAPI');
const { webserverConnect } = require('./webserver/webserverAPI');
const { runTimer } = require('./global/services/timerAPI');

async function start() {
  global.userDb = {};
  await firebaseConnect();

  await discordConnect();

  await ircConnect();

  await telegramConnect();

  await runTimer();

  await webserverConnect();
}

start();

// Stop the bot when the process is closed (via Ctrl-C).
const destroy = () => {
  try {
    global.manager.teardown();
  } catch (err) {
    logger.error(`[${PREFIX}] ${err}`);
  }
};

process.on('unhandledRejection', error => {
  const errorObj = error;
  errorObj.stackTraceLimit = Infinity;
  logger.error(`[${PREFIX}] error.name: ${errorObj.name} on line ${errorObj.stack.split('\n')[4]}`);
  logger.error(`[${PREFIX}] error.message: ${errorObj.message}`);
  logger.error(`[${PREFIX}] error.stack: ${errorObj.stack}`);
  logger.error(`[${PREFIX}] error.code: ${errorObj.code}`);
});

process.on('SIGINT', destroy);
process.on('SIGTERM', destroy);
