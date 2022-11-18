import { parse } from 'path';
import log from '../utils/log';

const PREFIX = parse(__filename).name;

export default reagents;

/**
 *
 * @return {any}
 */
export async function reagents():Promise<string> {
  const response = 'https://i.imgur.com/wETJsZr.png';
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
