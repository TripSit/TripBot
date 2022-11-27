import { parse } from 'path';
import { db, getUser } from '../utils/knex';
import { UserExperience } from '../@types/pgdb';
import log from '../utils/log';

const PREFIX = parse(__filename).name;

export default experience;

/**
 * Get a user's experience
 * @param {string} userId
 * @return {string}
 */
export async function experience(
  userId: string,
):Promise<string> {
  const userData = await getUser(userId, null);
  const experienceData = await db<UserExperience>('user_experience')
    .where('user_id', userData.id)
    .orderBy('level', 'desc');

  log.debug(`[${PREFIX}] experienceData: ${JSON.stringify(experienceData, null, 2)}`);

  let response = '';
  for (const row of experienceData) { // eslint-disable-line no-restricted-syntax
    log.debug(`[${PREFIX}] row: ${JSON.stringify(row, null, 2)}`);
    // Lowercase besides the first letter
    const levelName = (row.type as string).charAt(0).toUpperCase() + (row.type as string).slice(1).toLowerCase();
    response += `**Level ${row.level} ${levelName}**`;
    if (levelName === 'Total') {
      response += ': All experience combined\n';
    }
    if (levelName === 'Tripsitter') {
      response += `: Harm Reduction Center category
      (Must have Helper role to get Sitter exp!)\n`;
    }
    if (levelName === 'Team') {
      response += ': TeamTripsit category\n';
    }
    if (levelName === 'Developer') {
      response += ': Development category\n';
    }
    if (levelName === 'General') {
      response += ': Campground and Backstage\n';
    }
    if (levelName === 'Ignored') {
      response += ': Botspam, just for fun\n';
    }
  }

  if (response === '') {
    response = 'No experience found!';
  }

  log.info(`[${PREFIX}] response: ${response}`);
  return response;
}
