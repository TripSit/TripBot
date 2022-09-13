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
  global.ircClient.addListener('part', (
      channel:string,
      nick:string,
      reason:string,
      message:ircMessage,
  ) => {
    // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
    // {
    //   "prefix": "tektest!~tektest@87.249.tky.mi",
    //   "nick": "tektest",
    //   "user": "~tektest",
    //   "host": "87.249.tky.mi",
    //   "command": "PART",
    //   "rawCommand": "PART",
    //   "commandType": "normal",
    //   "args": [
    //     "#sandbox-dev"
    //   ]
    // }
    watcher(message);
  });
};
