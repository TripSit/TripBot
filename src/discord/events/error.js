'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/logger');

module.exports = {
  name: 'error',

  execute(err) {
    logger.error(`[${PREFIX}] Client error:`, err);
  },
};
