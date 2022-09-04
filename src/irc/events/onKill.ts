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
    global.ircClient.addListener('kill', (
        nick:string,
        reason:string,
        channels:string,
        message:ircMessage,
    ) => {
    // logger.debug(`[${PREFIX}] ${JSON.stringify(message, null, 2)}`);
      watcher(message);
    });
  },
};
