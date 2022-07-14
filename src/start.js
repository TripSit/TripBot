'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('./global/utils/logger');
const { discordConnect } = require('./discord/discordAPI');
const { ircConnect } = require('./irc/ircAPI');
const { firebaseConnect } = require('./global/services/firebaseAPI');
const { webserverConnect } = require('./webserver/webserverAPI');
const { runTimer } = require('./global/services/timerAPI');

async function start() {
  // Initialize Firebase
  logger.debug(`[${PREFIX}] Firebase starting`);
  await firebaseConnect();
  logger.debug(`[${PREFIX}] Firebase started!`);

  // Initialize discord bot
  logger.debug(`[${PREFIX}] Discord starting`);
  await discordConnect();
  logger.debug(`[${PREFIX}] Discord started!`);

  // Initialize IRC bot
  logger.debug(`[${PREFIX}] IRC starting`);
  await ircConnect();
  logger.debug(`[${PREFIX}] IRC started!`);

  // Initialize timer globally
  logger.debug(`[${PREFIX}] Timer starting`);
  await runTimer();
  logger.debug(`[${PREFIX}] Timer started!`);

  // Initialize webclient
  logger.debug(`[${PREFIX}] Webclient starting`);
  await webserverConnect();
  logger.debug(`[${PREFIX}] Webclient started!`);

  logger.info(`[${PREFIX}] Ready to take over the world!`);
}

start();

// Stop the bot when the process is closed (via Ctrl-C).
const destroy = () => {
  global.manager.teardown();
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
