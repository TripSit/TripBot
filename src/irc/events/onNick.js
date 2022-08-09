'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');
const { watcher } = require('../utils/uatu');

module.exports = {
  async execute() {
    global.ircClient.addListener('nick', (oldnick, newnick, channels, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      // {
      //   "prefix": "Moony!~teknos@tripsit/founder/Teknos",
      //   "nick": "Moony",
      //   "user": "~teknos",
      //   "host": "tripsit/founder/Teknos",
      //   "command": "NICK",
      //   "rawCommand": "NICK",
      //   "commandType": "normal",
      //   "args": [
      //     "Moonpie"
      //   ]
      // }
      watcher(message, newnick);
    });
  },
};
