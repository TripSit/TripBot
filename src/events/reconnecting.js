'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger');

module.exports = {
  name: 'reconnecting',
  execute() {
    logger.info(`[${PREFIX}] Reconnecting...`);
  },
};
