'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

module.exports = {
  async execute() {
    global.ircClient.addListener('unhandled', message => {
      if (message.args[2].indexOf('is using a secure connection') === -1) {
        logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      }
    });
  },
};
