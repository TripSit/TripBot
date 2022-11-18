/* eslint-disable max-len */
import { parse } from 'path';
import { db, getUser } from '../utils/knex';
import {
  UserExperience,
} from '../@types/pgdb.d';
import log from '../utils/log';

const PREFIX = parse(__filename).name;

export default profile;

/**
 * Get profile info
 * @param {string} memberId The user to either set or get the timezone!
 * @return {any[]} an object with information about the bot
 */
export async function profile(
  memberId: string,
):Promise<ProfileData> {
  // log.debug(`[${PREFIX}] memberId: ${memberId}`);

  const userData = await getUser(memberId, null);

  // log.debug(`[${PREFIX}] userData: ${JSON.stringify(userData, null, 2)}`);

  const profileData = {
    birthday: userData.birthday,
    timezone: userData.timezone,
    karma_given: userData.karma_given,
    karma_received: userData.karma_received,
    totalExp: 0,
  };

  // log.debug(`[${PREFIX}] profileData: ${JSON.stringify(profileData, null, 2)}`);

  const currentExp = await db<UserExperience>('user_experience')
    .select(
      db.ref('total_points'),
      db.ref('type'),
    )
    .where('user_id', userData.id);

  // log.debug(`[${PREFIX}] currentExp: ${JSON.stringify(currentExp, null, 2)}`);

  // Go through currentExp and add up the total points
  // for (const exp of currentExp) {
  currentExp.forEach((exp) => {
    if (exp.type !== 'IGNORED') {
      profileData.totalExp += exp.total_points;
    }
  });
  log.info(`[${PREFIX}] response: ${JSON.stringify(profileData, null, 2)}`);
  return profileData;
}

type ProfileData = {
  birthday: Date | null,
  timezone: string | null,
  karma_given: number,
  karma_received: number,
  totalExp: number,
};
