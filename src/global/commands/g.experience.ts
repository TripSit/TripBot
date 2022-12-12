import { parse } from 'path';
import { db, getUser } from '../utils/knex';
import { UserExperience, ExperienceType } from '../@types/pgdb';

const F = f(__filename);

export default experience;

type ExpTypeNames = 'Total' | 'Tripsitter' | 'Team' | 'Developer' | 'General' | 'Ignored';

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
    .andWhereNot('type', 'TOTAL')
    .orderBy('level', 'desc');

  // log.debug(F, `experienceData: ${JSON.stringify(experienceData, null, 2)}`);

  let allExpPoints = 0;
  experienceData.forEach(exp => {
    allExpPoints += exp.total_points;
  });
  let totalLevel = 0;
  let totalLevelPoints = allExpPoints;
  let totalExpToLevel = 0;
  while (totalLevelPoints > totalExpToLevel) {
    totalExpToLevel = 5 * (totalLevel ** 2) + (50 * totalLevel) + 100;
    totalLevel += 1;
    totalLevelPoints -= totalExpToLevel;
  }

  let response = `**Level ${totalLevel} Total**: : All experience combined\n`;
  for (const row of experienceData) { // eslint-disable-line no-restricted-syntax
  // log.debug(F, `row: ${JSON.stringify(row, null, 2)}`);
    // Lowercase besides the first letter
    const levelName = (row.type as ExperienceType).charAt(0).toUpperCase()
    + (row.type as ExperienceType).slice(1).toLowerCase() as ExpTypeNames;
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
