'use strict';

const path = require('path');
const irc = require('irc-upd');
const logger = require('../global/utils/logger');
const ircConfig = require('./assets/config/irc_config.json');
const { watcher } = require('./utils/uatu');
const { experience } = require('../global/utils/experience');
const { verifyLink } = require('../discord/commands/guild/link-accounts');

const PREFIX = path.parse(__filename).name;

const {
  NODE_ENV,
  ircServer,
  ircUsername,
  ircPassword,
} = require('../../env');

module.exports = {
  async ircConnect(client) {
    logger.info(`[${PREFIX}] started!`);
    // If there is no password provided, dont even try to connect
    if (!ircPassword) { return; }

    let ircChannels = [];
    if (NODE_ENV === 'production') {
      ircChannels = [
        '#sanctuary',
        '#tripsit',
        '#tripsit1',
        '#tripsit2',
        '#tripsit3',
        '#tripsit-dev',
        '#content',
        '#sandbox',
        '#lounge',
        '#opiates',
        '#stims',
        '#depressants',
        '#dissociatives',
        '#psychedelics',
        '#moderators',
        '#meeting-room',
        '#teamtripsit',
        '#operations',
        '#modhaven',
        '#tripsit.me',
      ];
    } else {
      ircChannels = [
        '#sandbox-dev',
      ];
    }

    ircConfig.userName = ircUsername;
    ircConfig.password = ircPassword;
    ircConfig.channels = ircChannels;

    // logger.debug(`[${PREFIX}] ircConfig: ${JSON.stringify(ircConfig, null, 2)}`);
    global.ircClient = new irc.Client(ircServer, ircUsername, ircConfig);
    global.ircClient.addListener('registered', () => {
      logger.info(`[${PREFIX}] Registered!`);
      // global.ircClient.say('Moonbear', 'Hello world!');
    });
    global.ircClient.addListener('error', message => {
      // It always seems to show this error first before actually working
      // The second error happens doing whois on a user
      if (message.args[1] !== 'You have not registered' && message.args[2] !== 'No such nick/channel') {
        logger.error(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      }
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
    global.ircClient.addListener('message#', (nick, to, text, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      // {
      //   "prefix": "Moonbear!~teknos@tripsit/founder/Teknos",
      //   "nick": "Moonbear",
      //   "user": "~teknos",
      //   "host": "tripsit/founder/Teknos",
      //   "command": "PRIVMSG",
      //   "rawCommand": "PRIVMSG",
      //   "commandType": "normal",
      //   "args": [
      //     "#sandbox-dev",
      //     "test"
      //   ]
      // }
      experience(message, client);
    });
    global.ircClient.addListener('join', (channel, nick, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      watcher(client, message);
    });
    global.ircClient.addListener('part', (channel, nick, reason, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      watcher(client, message);
    });
    global.ircClient.addListener('kick', (channel, nick, by, reason, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      watcher(client, message);
    });
    global.ircClient.addListener('quit', (nick, reason, channels, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      watcher(client, message);
    });
    global.ircClient.addListener('kill', (nick, reason, channels, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      watcher(client, message);
    });
    global.ircClient.addListener('nick', (oldnick, newnick, channels, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      watcher(client, message, newnick);
    });
  },
};
