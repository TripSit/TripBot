import {getUser} from '../utils/knex';
import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;

/**
 * @param {string} userId
 * @return {any}
 */
export async function h2flow(userId:string):Promise<any> {
  const response = await getUser(userId, null);
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
};
