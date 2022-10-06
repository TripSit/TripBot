import {watcher} from '../utils/uatu';
import {ircMessage} from '../@types/irc';
// import logger from '../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

/**
 *
 * @return {Promise<void>}
 */
export async function execute():Promise<void> {
  global.ircClient.addListener('kill', (
    nick:string,
    reason:string,
    channels:string,
    message:ircMessage,
  ) => {
    // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
    watcher(message);
  });
};
