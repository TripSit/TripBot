import { parse } from 'path';
import { getUser } from '../utils/knex';
import { Users } from '../@types/pgdb.d';
import log from '../utils/log';

const PREFIX = parse(__filename).name;

export default karma;

/**
 *
 * @param {string} memberId
 * @return {any} an object with information about the bot
 */
export async function karma(
  memberId: string,
):Promise<Users> {
  const userData = await getUser(memberId, null);
  log.info(`[${PREFIX}] userData: ${JSON.stringify(userData, null, 2)}`);
  return userData;
}
