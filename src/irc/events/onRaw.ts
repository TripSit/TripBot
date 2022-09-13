import {ircMessage} from '../@types/irc';
import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 *
 * @return {Promise<void>}
 */
export async function execute():Promise<void> {
  global.ircClient.addListener('onRaw', (message:ircMessage) => {
    logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
  });
};
