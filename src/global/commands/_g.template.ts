/* eslint-disable no-unused-vars */

import {stripIndents} from 'common-tags';
import env from '../utils/env.config';
import log from '../utils/log';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

/**
 *
 * @return {any}
 */
export async function globalTemplate():Promise<any> {
  log.debug(`${PREFIX} started!`);
  log.debug(`${PREFIX} finished!`);
};
