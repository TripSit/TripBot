import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

module.exports = {
  name: 'reconnecting',
  execute() {
    logger.info(`[${PREFIX}] Reconnecting...`);
  },
};
