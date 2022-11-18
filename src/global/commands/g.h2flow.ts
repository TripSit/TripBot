import { parse } from 'path';
import { getUser } from '../utils/knex';
import { Users } from '../@types/pgdb';
import log from '../utils/log';

const PREFIX = parse(__filename).name;

export default h2flow;

/**
 * @param {string} userId
 * @return {any}
 */
export async function h2flow(userId:string):Promise<Users> {
  const response = await getUser(userId, null);
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
