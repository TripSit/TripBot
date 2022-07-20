'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

module.exports = {
  async execute() {
    global.ircClient.addListener('onRaw', message => {
      logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
    });
  },
};
