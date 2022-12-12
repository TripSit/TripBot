import { parse } from 'path';

const F = f(__filename);

export default combochart;

/**
 * Returns a link to the combo chart
 * @return {string}
 */
export async function combochart():Promise<string> {
  const response = 'https://i.imgur.com/juzYjDl.png';
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
