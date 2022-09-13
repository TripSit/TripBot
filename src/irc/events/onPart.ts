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
  },
};
