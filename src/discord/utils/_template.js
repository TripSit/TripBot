'use strict';

const path = require('path');
const logger = require('../../global/utils/logger');

const PREFIX = path.parse(__filename).name;

module.exports = {
  async thoughtPolice() {
    logger.debug(`[${PREFIX}] started!`);

    logger.debug(`[${PREFIX}] finished!`);
  },
};
