import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

module.exports = {
  name: 'reconnecting',
  execute() {
    logger.info(`[${PREFIX}] Reconnecting...`);
  },
};
