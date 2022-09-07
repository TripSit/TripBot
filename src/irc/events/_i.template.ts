/* eslint-disable no-unused-vars */
import {watcher} from '../utils/uatu';
import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

/**
 *
 * @return {Promise<void>}
 */
module.exports = {
  async execute() {
    global.ircClient.addListener('eventName', (exception:Error) => {
      logger.error(`[${PREFIX}] ${JSON.stringify(exception, null, 2)}`);
    });
  },
};
