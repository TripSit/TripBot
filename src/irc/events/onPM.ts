// import {watcher} from '../utils/uatu';
import {ircMessage} from '../@types/irc';
import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;
// import {linkAccounts} from '../archive/link-accounts';

/**
 *
 * @return {Promise<void>}
 */
export async function execute():Promise<void> {
  global.ircClient.addListener('pm', async (
      from:string,
      message:ircMessage,
  ) => {
    logger.debug(`[${PREFIX}] PM from ${from}: ${message}`);
    // If the message matches the format of a token
    // const token = message.match(/\S{6}-\S{6}-\S{6}/);
    // if (token !== null) {
    //   linkAccounts(from, token);
    // }
  });
};
