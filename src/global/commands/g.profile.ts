/* eslint-disable max-len */
import { experienceGet, getUser } from '../utils/knex';

const F = f(__filename);

export default profile;

/**
 * Get profile info
 * @param {string} memberId The user to either set or get the timezone!
 * @return {any[]} an object with information about the bot
 */
export async function profile(
  memberId: string,
):Promise<ProfileData> {
  // log.debug(F, `memberId: ${memberId}`);

  const userData = await getUser(memberId, null);

  // log.debug(F, `userData: ${JSON.stringify(userData, null, 2)}`);

  const profileData = {
    birthday: userData.birthday,
    timezone: userData.timezone,
    karma_given: userData.karma_given,
    karma_received: userData.karma_received,
    totalExp: 0,
  };

  // log.debug(F, `profileData: ${JSON.stringify(profileData, null, 2)}`);

  const expData = await experienceGet(userData.id);

  expData.forEach(exp => {
    if (exp.type !== 'TOTAL' && exp.type !== 'IGNORED') {
      profileData.totalExp += exp.total_points;
    }
  });
  log.info(F, `response: ${JSON.stringify(profileData, null, 2)}`);
  return profileData;
}

type ProfileData = {
  birthday: Date | null,
  timezone: string | null,
  karma_given: number,
  karma_received: number,
  totalExp: number,
};
