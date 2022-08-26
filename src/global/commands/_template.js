'use strict';

const PREFIX = require('path').parse(__filename).name;
const logger = require('./logger');

module.exports = {
  async example() {
    logger.debug(`${PREFIX} started!`);
  },
};
