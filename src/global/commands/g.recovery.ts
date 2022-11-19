import { parse } from 'path';
import log from '../utils/log';

const PREFIX = parse(__filename).name;

export default recovery;

/**
 *
 * @return {string}
 */
export async function recovery():Promise<string> {
  const response = 'https://i.imgur.com/nTEm0QE.png';
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
