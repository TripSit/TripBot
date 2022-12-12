import { parse } from 'path';

const F = f(__filename);

export default globalTemplate;

/**
 *
 * @return {string}
 */
export async function globalTemplate():Promise<string> {
  const response = 'I did thing!';
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
