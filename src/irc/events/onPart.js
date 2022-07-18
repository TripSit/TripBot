'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');
const { watcher } = require('../utils/uatu');

module.exports = {
  name: 'onReady',
  async execute() {
    global.ircClient.addListener('part', (channel, nick, reason, message) => {
      // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      watcher(message);
    });
  },
};
