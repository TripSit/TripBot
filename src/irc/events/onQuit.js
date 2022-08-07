'use strict';

// const PREFIX = require('path').parse(__filename).name;
// const logger = require('../../global/utils/logger');
// const { watcher } = require('../utils/uatu');

module.exports = {
  async execute() {
    global.ircClient.addListener('quit', (/* nick, reason, channels, message */) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      // watcher(message);
    });
  },
};
