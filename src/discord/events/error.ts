import {errorEvent} from '../@types/eventDef';
import logger from '../../global/utils/logger';
import * as path from 'path';
const PREFIX = path.parse(__filename).name;

export const error: errorEvent = {
  name: 'error',
  once: false,
  async execute(error: Error):Promise<void> {
    logger.error(`[${PREFIX}] Client error ${JSON.stringify(error, null, 2)}`);
    logger.error(`[${PREFIX}] error.name: ${error.name}`);
    logger.error(`[${PREFIX}] error.message: ${error.message}`);
    logger.error(`[${PREFIX}] error.stack: ${error.stack}`);
  },
};
