'use strict';

const path = require('path');
const irc = require('irc-upd');
const logger = require('./logger');
const ircConfig = require('../assets/irc_config.json');

const { verifyLink } = require('../commands/guild/link-accounts');

const PREFIX = path.parse(__filename).name;

const {
  ircServer,
  ircUsername,
  ircPassword,
} = require('../../env');

module.exports = {
  async connectIRC(client) {
    // IRC Connection, this takes a while so do it first
    ircConfig.userName = ircUsername;
    ircConfig.password = ircPassword;

    // logger.debug(`[${PREFIX}] ircConfig: ${JSON.stringify(ircConfig, null, 2)}`);
    global.ircClient = new irc.Client(ircServer, ircUsername, ircConfig);
    global.ircClient.addListener('registered', () => {
      logger.debug(`[${PREFIX}] Registered!`);
      // global.ircClient.say('Moonbear', 'Hello world!');
    });
    global.ircClient.addListener('pm', async (from, message) => {
      logger.debug(`[${PREFIX}] PM from ${from}: ${message}`);

      const tokenRegex = /\S{6}-\S{6}-\S{6}/;

      const token = message.match(tokenRegex);

      if (token !== null) {
        logger.debug(`[${PREFIX}] PM token: ${token}`);
        // global.ircClient.say(from, `Your token is ${token}`);
        await global.ircClient.whois(from, info => {
          if (!info.account) {
            global.ircClient.say(from, `${from} is not registered on IRC, please go ~register on IRC!`);
          }
          // logger.debug(`[${PREFIX}] PM info: ${JSON.stringify(info, null, 2)}`);
          verifyLink(client, 'irc', info, token);
        });
      }
    });
    global.ircClient.addListener('error', message => {
      logger.error(`[${PREFIX}] Error: ${JSON.stringify(message, null, 2)}`);
      // global.ircClient.say('Moonbear', 'Hello world!');
    });
  },
};
