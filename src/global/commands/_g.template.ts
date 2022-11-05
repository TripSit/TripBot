import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

/**
 *
 * @return {string}
 */
export async function globalTemplate():Promise<string> {
  const response = `I did thing!`;
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
};
