import {ircMessage} from '../@types/irc';
import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

/**
 *
 * @return {Promise<void>}
 */
export async function execute():Promise<void> {
  global.ircClient.addListener('unhandled', (message:ircMessage) => {
    if (message.args[2].indexOf('is using a secure connection') === -1) {
      logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
    }
  });
};
