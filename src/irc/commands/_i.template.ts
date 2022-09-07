/* eslint-disable no-unused-vars */
import env from '../../global/utils/env.config';
import logger from '../../global/utils/logger';
const PREFIX = require('path').parse(__filename).name;

/**
 *
 * @return {Promise<void>}
 */
export async function template(): Promise<void> {
  logger.debug(`[${PREFIX}] start!`);
};
