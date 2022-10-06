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
  global.ircClient.addListener('kick', (
    channel:string,
    nick:string,
    by:string,
    reason:string,
    message:ircMessage,
  ) => {
    // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
    // {
    //   "prefix": "Moonbear!~teknos@tripsit/founder/Teknos",
    //   "nick": "Moonbear",
    //   "user": "~teknos",
    //   "host": "tripsit/founder/Teknos",
    //   "command": "KICK",
    //   "rawCommand": "KICK",
    //   "commandType": "normal",
    //   "args": [
    //     "#sandbox-dev",
    //     "TestNick",
    //     "reason"
    //   ]
    // }
    watcher(message);
  });
};
