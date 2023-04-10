'use strict';

const F = f(__filename);
const logger = require('../../global/utils/logger');
const {verifyLink} = require('../../discord/commands/guild/link-accounts');

module.exports = {
  async linkAccounts(from, token) {
    log.debug(F, `start!`);
    log.debug(F, `PM token: ${token}`);
    global.ircClient.say(from, `Your token is ${token}`);
    await global.ircClient.whois(from, (info) => {
      if (!info.account) {
        global.ircClient.say(from, `${from} is not registered on IRC, please go ~register on IRC!`);
      }
      // log.debug(F, `PM info: ${JSON.stringify(info, null, 2)}`);
      verifyLink('irc', info, token);
    });
  },
};
