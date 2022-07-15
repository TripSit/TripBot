'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('./logger');

module.exports = {
  async feedback() {
    logger.debug(`${PREFIX} started!`);
  },
};
