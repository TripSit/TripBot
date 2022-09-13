/* eslint-disable no-unused-vars */
import {watcher} from '../utils/uatu';
import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 *
 * @return {Promise<void>}
 */
export async function execute():Promise<void> {
  global.ircClient.addListener('eventName', (exception:Error) => {
    logger.error(`[${PREFIX}] ${JSON.stringify(exception, null, 2)}`);
  });
};
