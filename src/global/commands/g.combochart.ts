import { parse } from 'path';
import log from '../utils/log';

const PREFIX = parse(__filename).name;

export default combochart;

/**
 * Returns a link to the combo chart
 * @return {string}
 */
export async function combochart():Promise<string> {
  const response = 'https://i.imgur.com/juzYjDl.png';
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
