import { getUser } from '../utils/knex';
import { Users } from '../@types/database';

const F = f(__filename);

export default h2flow;

/**
 * @param {string} userId
 * @return {any}
 */
export async function h2flow(userId:string):Promise<Users> {
  const response = await getUser(userId, null);
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
