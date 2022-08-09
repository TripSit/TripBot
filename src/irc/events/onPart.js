'use strict';

// const PREFIX = require('path').parse(__filename).name;
// const logger = require('../../global/utils/logger');
const { watcher } = require('../utils/uatu');

module.exports = {
  async execute() {
    global.ircClient.addListener('part', (channel, nick, reason, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      // {
      //   "prefix": "tektest!~tektest@87.249.tky.mi",
      //   "nick": "tektest",
      //   "user": "~tektest",
      //   "host": "87.249.tky.mi",
      //   "command": "PART",
      //   "rawCommand": "PART",
      //   "commandType": "normal",
      //   "args": [
      //     "#sandbox-dev"
      //   ]
      // }
      watcher(message);
    });
  },
};
