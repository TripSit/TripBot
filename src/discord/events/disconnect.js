'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('../../global/logger');

module.exports = {
  name: 'disconnect',

  execute(evt) {
    logger.warn(`[${PREFIX}] Disconnected: ${evt.reason} (${evt.code})`, evt);
  },
};
