import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

/**
 *
 * @return {any}
 */
export async function globalTemplate():Promise<any> {
  const response = `I did thing!`;
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
};
