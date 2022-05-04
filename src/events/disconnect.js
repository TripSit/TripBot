'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger');

module.exports = {
  name: 'disconnect',

  execute(evt) {
    logger.warn(`[${PREFIX}] Disconnected: ${evt.reason} (${evt.code})`, evt);
  },
};
