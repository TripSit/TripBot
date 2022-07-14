'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/logger');

module.exports = {
  name: 'reconnecting',
  execute() {
    logger.info(`[${PREFIX}] Reconnecting...`);
  },
};
