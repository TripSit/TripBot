/* eslint-disable max-len */
import {db} from '../../global/utils/knex';
import {
  Users,
  UserExperience,
} from '../../global/@types/pgdb.d';
// import * as path from 'path';
// import logger from '../../global/utils/logger';
// const PREFIX = path.parse(__filename).name;


/**
 * Get profile info
 * @param {string} memberId The user to either set or get the timezone!
 * @return {any[]} an object with information about the bot
 */
export async function profile(
  memberId: string,
):Promise<any> {
  // logger.debug(`[${PREFIX}] memberId: ${memberId}`);
  let userData = await db<Users>('users')
    .select(
      db.ref('id').as('id'),
      db.ref('birthday').as('birthday'),
      db.ref('timezone').as('timezone'),
      db.ref('karma_given').as('karma_given'),
      db.ref('karma_received').as('karma_received'),
    )
    .where('discord_id', memberId);

  if (!userData[0]) {
    userData = await db
      .insert({discord_id: memberId})
      .into('users')
      .returning('*');
  }

  // logger.debug(`[${PREFIX}] data: ${JSON.stringify(userData, null, 2)}`);

  const profileData = {
    birthday: userData[0].birthday,
    timezone: userData[0].timezone,
    karma_given: userData[0].karma_given,
    karma_received: userData[0].karma_received,
    totalExp: 0,
  };

  const currentExp = await db
    .select(
      db.ref('type').as('type'),
      db.ref('total_points').as('total_points'),
    )
    .from<UserExperience>('user_experience')
    .where('user_id', userData[0].id);

  // logger.debug(`[${PREFIX}] currentExp: ${JSON.stringify(currentExp, null, 2)}`);

  // Go through currentExp and add up the total points
  for (const exp of currentExp) {
    if (exp.type !== 'IGNORED') {
      profileData.totalExp += exp.total_points;
    }
  }

  return profileData;
}
