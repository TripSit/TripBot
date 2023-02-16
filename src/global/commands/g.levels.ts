import { experienceGet, getUser } from '../utils/knex';
import { expForNextLevel, getTotalLevel } from '../utils/experience';
// import { ExperienceCategory, ExperienceType } from '../@types/database';
// import { ExperienceType } from '../@types/database';

const F = f(__filename); // eslint-disable-line

export default levels;

// type ExpTypeNames = 'Total' | 'Tripsitter' | 'Team' | 'Developer' | 'General' | 'Ignored';

type ExperienceData = {
  TEXT: {
    TOTAL: {
      level: number,
      level_exp: number,
      nextLevel: number,
      total_exp: number,
    },
    [key: string]: {
      level: number,
      level_exp: number,
      nextLevel: number,
      total_exp: number,
    },
  },
  VOICE: {
    TOTAL: {
      level: number,
      level_exp: number,
      nextLevel: number,
      total_exp: number,
    },
    [key: string]: {
      level: number,
      level_exp: number,
      nextLevel: number,
      total_exp: number,
    },
  },
};
/**
 * Get a user's experience
 * @param {string} userId
 * @return {string}
 */
export async function levels(
  discordId: string,
):Promise<ExperienceData> {
  const userData = await getUser(discordId, null);
  const experienceData = await experienceGet(10, undefined, undefined, userData.id);

  const results = {
    TEXT: {
      TOTAL: {
        level: 0,
        level_exp: 0,
        nextLevel: 0,
        total_exp: 0,
      },
    },
    VOICE: {
      TOTAL: {
        level: 0,
        level_exp: 0,
        nextLevel: 0,
        total_exp: 0,
      },
    },
  } as ExperienceData;

  if (!experienceData) {
    return results;
  }

  experienceData.forEach(async exp => {
    if (exp.category !== 'TOTAL' && exp.category !== 'IGNORED') {
      results[exp.type].TOTAL.total_exp += exp.total_points;
      results[exp.type][exp.category] = {
        level: exp.level,
        level_exp: exp.level_points,
        nextLevel: await expForNextLevel(exp.level), // eslint-disable-line no-await-in-loop
        total_exp: exp.total_points,
      };
    }
  });

  const totalTextData = await getTotalLevel(results.TEXT.TOTAL.total_exp);
  results.TEXT.TOTAL.level = totalTextData.level;
  results.TEXT.TOTAL.level_exp = totalTextData.level_points;
  results.TEXT.TOTAL.nextLevel = await expForNextLevel(totalTextData.level); // eslint-disable-line no-await-in-loop

  const totalVoiceData = await getTotalLevel(results.VOICE.TOTAL.total_exp);
  results.VOICE.TOTAL.level = totalVoiceData.level;
  results.VOICE.TOTAL.level_exp = totalVoiceData.level_points;
  results.VOICE.TOTAL.nextLevel = await expForNextLevel(totalVoiceData.level); // eslint-disable-line no-await-in-loop

  log.info(F, `results: ${JSON.stringify(results, null, 2)}`);
  return results;
}
