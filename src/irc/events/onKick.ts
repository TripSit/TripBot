import {watcher} from '../utils/uatu';
import {ircMessage} from '../@types/irc.d';
// import logger from '../../global/utils/logger';
// const PREFIX = require('path').parse(__filename).name;

/**
 *
 * @return {Promise<void>}
 */
module.exports = {
  async execute() {
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
  },
};
