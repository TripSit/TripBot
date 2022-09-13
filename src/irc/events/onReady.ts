import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

/**
 *
 * @return {Promise<void>}
 */
export async function execute():Promise<void> {
  global.ircClient.addListener('registered', () => {
    const bootDuration = (new Date().getTime() - global.bootTime.getTime()) / 1000;
    logger.info(`[${PREFIX}] IRC bot initialized in ${bootDuration}s: ready to party like it's 2001!`);
  });
};
