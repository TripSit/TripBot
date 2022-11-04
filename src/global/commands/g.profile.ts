/* eslint-disable max-len */
import {db, getUser} from '../../global/utils/knex';
import {
  UserExperience,
} from '../../global/@types/pgdb.d';
import log from '../utils/log';
import {parse} from 'path';
const PREFIX = parse(__filename).name;


/**
 * Get profile info
 * @param {string} memberId The user to either set or get the timezone!
 * @return {any[]} an object with information about the bot
 */
export async function profile(
  memberId: string,
):Promise<any> {
  // log.debug(`[${PREFIX}] memberId: ${memberId}`);

  const userData = await getUser(memberId, null);

  const profileData = {
    birthday: userData.birthday,
    timezone: userData.timezone,
    karma_given: userData.karma_given,
    karma_received: userData.karma_received,
    totalExp: 0,
  };

  const currentExp = await db<UserExperience>('user_experience')
    .select('*')
    .where('user_id', userData.id);

  // log.debug(`[${PREFIX}] currentExp: ${JSON.stringify(currentExp, null, 2)}`);

  // Go through currentExp and add up the total points
  for (const exp of currentExp) {
    if (exp.type !== 'IGNORED') {
      profileData.totalExp += exp.total_points;
    }
  }
  log.info(`[${PREFIX}] response: ${JSON.stringify(profileData, null, 2)}`);
  return profileData;
}
