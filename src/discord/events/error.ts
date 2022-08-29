import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

module.exports = {
  name: 'error',
  execute(error: Error) {
    logger.error(`[${PREFIX}] Client error ${JSON.stringify(error, null, 2)}`);
    logger.error(`[${PREFIX}] error.name: ${error.name}`);
    logger.error(`[${PREFIX}] error.message: ${error.message}`);
    logger.error(`[${PREFIX}] error.stack: ${error.stack}`);
  },
};
