import { getUser } from '../utils/knex';
import { Users } from '../@types/database';

const F = f(__filename);

export default karma;

/**
 *
 * @param {string} memberId
 * @return {any} an object with information about the bot
 */
export async function karma(
  memberId: string,
):Promise<Users> {
  const userData = await getUser(memberId, null, null);
  log.info(F, `userData: ${JSON.stringify(userData, null, 2)}`);
  return userData;
}
