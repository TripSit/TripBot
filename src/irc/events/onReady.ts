import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 *
 * @return {Promise<void>}
 */
module.exports = {
  async execute() {
    global.ircClient.addListener('registered', () => {
      const bootDuration = (new Date().getTime() - global.bootTime.getTime()) / 1000;
      logger.info(`[${PREFIX}] IRC bot initialized in ${bootDuration}s: ready to party like it's 2001!`);
    });
  },
};
