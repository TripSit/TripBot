'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/utils/logger');

module.exports = {
  async execute() {
    global.ircClient.addListener('netError', exception => {
      logger.error(`[${PREFIX}] ${JSON.stringify(exception, null, 2)}`);
    });
  },
};
