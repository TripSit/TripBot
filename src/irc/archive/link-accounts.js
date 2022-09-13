'use strict';

import * as path from 'path';
const PREFIX = path.parse(__filename).name;
const logger = require('../../global/utils/logger');
const {verifyLink} = require('../../discord/commands/guild/link-accounts');

module.exports = {
  async linkAccounts(from, token) {
    logger.debug(`[${PREFIX}] start!`);
    logger.debug(`[${PREFIX}] PM token: ${token}`);
    global.ircClient.say(from, `Your token is ${token}`);
    await global.ircClient.whois(from, (info) => {
      if (!info.account) {
        global.ircClient.say(from, `${from} is not registered on IRC, please go ~register on IRC!`);
      }
      // logger.debug(`[${PREFIX}] PM info: ${JSON.stringify(info, null, 2)}`);
      verifyLink('irc', info, token);
    });
  },
};
