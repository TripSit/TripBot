import {watcher} from '../utils/uatu';
import {ircMessage} from '../@types/irc.d';
// import logger from '../../global/utils/logger';
// import * as path from 'path';
// const PREFIX = path.parse(__filename).name;

/**
 *
 * @return {Promise<void>}
 */
module.exports = {
  async execute() {
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
  },
};
