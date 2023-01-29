import { experienceGet, getUser } from '../utils/knex';
import { ExperienceCategory } from '../@types/pgdb';
import { getTotalLevel } from '../utils/experience';

const F = f(__filename);

export default levels;

type ExpTypeNames = 'Total' | 'Tripsitter' | 'Team' | 'Developer' | 'General' | 'Ignored';

/**
 * Get a user's experience
 * @param {string} userId
 * @return {string}
 */
export async function levels(
  userId: string,
):Promise<string> {
  const userData = await getUser(userId, null);
  const experienceData = await experienceGet(1, undefined, undefined, userData.id);

  if (!experienceData) {
    return 'No experience found for this user';
  }

  // log.debug(F, `experienceData: ${JSON.stringify(experienceData, null, 2)}`);

  let allExpPoints = 0;
  experienceData.forEach(exp => {
    if (exp.category !== 'TOTAL' && exp.category !== 'IGNORED') {
      allExpPoints += exp.total_points;
    }
  });

  const totalData = await getTotalLevel(allExpPoints);

  let response = `**Level ${totalData.level} Total**: : All experience combined\n`;
  for (const row of experienceData) { // eslint-disable-line no-restricted-syntax
  // log.debug(F, `row: ${JSON.stringify(row, null, 2)}`);
    // Lowercase besides the first letter
    const levelName = (row.category as ExperienceCategory).charAt(0).toUpperCase()
    + (row.category as ExperienceCategory).slice(1).toLowerCase() as ExpTypeNames;
    response += `**Level ${row.level} ${levelName}**`;
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

  log.info(F, `response: ${response}`);
  return response;
}
