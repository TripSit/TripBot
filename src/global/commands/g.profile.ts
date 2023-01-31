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

  const expData = await experienceGet(10, undefined, undefined, userData.id);

  // log.debug(F, `expData: ${JSON.stringify(expData, null, 2)}`);

  // Sum up every experience point as long as the type isnt ignored or total
  const totalTextExp = expData
    .filter(exp => exp.type !== 'VOICE' && exp.category !== 'TOTAL' && exp.category !== 'IGNORED')
    .reduce((acc, exp) => acc + exp.total_points, 0);

  const totalVoiceExp = expData
    .filter(exp => exp.type === 'VOICE' && exp.category !== 'TOTAL' && exp.category !== 'IGNORED')
    .reduce((acc, exp) => acc + exp.total_points, 0);

  const profileData = {
    birthday: userData.birthday,
    timezone: userData.timezone,
    karma_given: userData.karma_given,
    karma_received: userData.karma_received,
    totalTextExp,
    totalVoiceExp,
  };
  log.info(F, `response: ${JSON.stringify(profileData, null, 2)}`);
  return profileData;
}

type ProfileData = {
  birthday: Date | null,
  timezone: string | null,
  karma_given: number,
  karma_received: number,
  totalTextExp: number,
  totalVoiceExp: number,
};
