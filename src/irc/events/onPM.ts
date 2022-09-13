// import {watcher} from '../utils/uatu';
import {ircMessage} from '../@types/irc.d';
import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;
// const {linkAccounts} = require('../archive/link-accounts');

/**
 *
 * @return {Promise<void>}
 */
module.exports = {
  async execute() {
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
  },
};
