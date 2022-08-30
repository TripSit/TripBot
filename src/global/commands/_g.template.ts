/* eslint-disable no-unused-vars */

import {stripIndents} from 'common-tags';
import env from '../utils/env.config';
import logger from '../utils/logger';
const PREFIX = require('path').parse(__filename).name;

/**
 * Does something
 * @return {any} Something
 */
export async function globalTemplate():Promise<any> {
  logger.debug(`${PREFIX} started!`);
  logger.debug(`${PREFIX} finished!`);
};
