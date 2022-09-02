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

const {
  NODE_ENV,
  firebaseRealtimeKey,
} = require('../env');

async function start() {
  global.userDb = {};
  global.guildDb = {};
  if (firebaseRealtimeKey) {
    await firebaseConnect();
  }

  await discordConnect();

  await ircConnect();

  // Telegram breaks on connect =/
  // await telegramConnect();

  await runTimer();

  await webserverConnect();
}

start();

// Stop the bot when the process is closed (via Ctrl-C).
const destroy = () => {
  logger.debug(`[${PREFIX}] Gracefully stopping the bot (CTRL + C pressed)`);
  process.exit(0);
};

process.on('unhandledRejection', error => {
  const errorObj = error;
  errorObj.stackTraceLimit = Infinity;
  logger.error(`[${PREFIX}] error.name: ${errorObj.name}}`);
  logger.error(`[${PREFIX}] error.code: ${errorObj.code}`);
  logger.error(`[${PREFIX}] error.mesg: ${errorObj.message}`);
  logger.error(`[${PREFIX}] error.stck: ${errorObj.stack}`);
});

process.on('SIGINT', destroy);
process.on('SIGTERM', destroy);
