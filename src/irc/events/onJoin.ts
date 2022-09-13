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
    global.ircClient.addListener('join', (
        channel:string,
        nick:string,
        message:ircMessage) => {
    // {
    //   "prefix": "TSDev!~TSDev@tripsit/bridge/TS1",
    //   "nick": "TSDev",
    //   "user": "~TSDev",
    //   "host": "tripsit/bridge/TS1",
    //   "command": "JOIN",
    //   "rawCommand": "JOIN",
    //   "commandType": "normal",
    //   "args": [
    //     "#sandbox-dev"
    //   ]
    // }
      watcher(message);
    });
  },
};
