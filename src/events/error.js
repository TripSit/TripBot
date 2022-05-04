'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger');

module.exports = {
  name: 'error',

  execute(err) {
    logger.error(`[${PREFIX}] Client error:`, err);
  },
};
