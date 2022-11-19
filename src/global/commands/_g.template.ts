import { parse } from 'path';
import log from '../utils/log';

const PREFIX = parse(__filename).name;

export default globalTemplate;

/**
 *
 * @return {string}
 */
export async function globalTemplate():Promise<string> {
  const response = 'I did thing!';
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
