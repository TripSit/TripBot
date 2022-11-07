import {getUser} from '../utils/knex';
import {parse} from 'path';
import {Users} from '../@types/pgdb.d';
const PREFIX = parse(__filename).name;
import log from '../utils/log';

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
};
