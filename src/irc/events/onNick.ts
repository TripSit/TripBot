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
  global.ircClient.addListener('nick', (
    oldnick:string,
    newnick:string,
    channels:string,
    message:ircMessage,
  ) => {
    // {
    //   "prefix": "Moony!~teknos@tripsit/founder/Teknos",
    //   "nick": "Moony",
    //   "user": "~teknos",
    //   "host": "tripsit/founder/Teknos",
    //   "command": "NICK",
    //   "rawCommand": "NICK",
    //   "commandType": "normal",
    //   "args": [
    //     "Moonpie"
    //   ]
    // }
    watcher(message, newnick);
  });
};
