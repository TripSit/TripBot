import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

/**
 *
 * @return {any}
 */
export async function reagents():Promise<any> {
  const response = 'https://i.imgur.com/wETJsZr.png';
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
};
