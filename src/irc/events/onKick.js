'use strict';

// const PREFIX = require('path').parse(__filename).name;
// const logger = require('../../global/utils/logger');
const { watcher } = require('../utils/uatu');

module.exports = {
  async execute() {
    global.ircClient.addListener('kick', (channel, nick, by, reason, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      // {
      //   "prefix": "Moonbear!~teknos@tripsit/founder/Teknos",
      //   "nick": "Moonbear",
      //   "user": "~teknos",
      //   "host": "tripsit/founder/Teknos",
      //   "command": "KICK",
      //   "rawCommand": "KICK",
      //   "commandType": "normal",
      //   "args": [
      //     "#sandbox-dev",
      //     "TestNick",
      //     "reason"
      //   ]
      // }
      watcher(message);
    });
  },
};
