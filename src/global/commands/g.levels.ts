import { experienceGet, getUser } from '../utils/knex';
import { expForNextLevel, getTotalLevel } from '../utils/experience';
import { ExperienceCategory, ExperienceType } from '../@types/pgdb';
// import { ExperienceType } from '../@types/pgdb';

const F = f(__filename); // eslint-disable-line

export default levels;

// type ExpTypeNames = 'Total' | 'Tripsitter' | 'Team' | 'Developer' | 'General' | 'Ignored';

type ExperienceData = {
  text: {
    total: {
      level: number,
      exp: number,
      nextLevel: number,
    },
    [key: string]: {
      level: number,
      exp: number,
      nextLevel: number,
    },
  },
  voice: {
    total: {
      level: number,
      exp: number,
      nextLevel: number,
    },
    [key: string]: {
      level: number,
      exp: number,
      nextLevel: number,
    },
  },
};
/**
 * Get a user's experience
 * @param {string} userId
 * @return {string}
 */
export async function levels(
  userId: string,
):Promise<ExperienceData> {
  const userData = await getUser(userId, null);
  const experienceData = await experienceGet(10, undefined, undefined, userData.id);

  if (!experienceData) {
    return {
      text: {
        total: {
          level: 0,
          exp: 0,
          nextLevel: 0,
        },
      },
      voice: {
        total: {
          level: 0,
          exp: 0,
          nextLevel: 0,
        },
      },
    };
  }

  // log.debug(F, `experienceData: ${JSON.stringify(experienceData, null, 2)}`);

  let allTextExp = 0;
  experienceData.forEach(exp => {
    if (exp.type !== 'VOICE' && exp.category !== 'TOTAL' && exp.category !== 'IGNORED') {
      allTextExp += exp.total_points;
    }
  });
  const totalTextData = await getTotalLevel(allTextExp);

  let allVoiceExp = 0;
  experienceData.forEach(exp => {
    if (exp.type === 'VOICE' && exp.category !== 'TOTAL' && exp.category !== 'IGNORED') {
      allVoiceExp += exp.total_points;
    }
  });
  const totalVoiceData = await getTotalLevel(allVoiceExp);

  const results = {
    text: {
      total: {
        level: totalTextData.level,
        exp: totalTextData.level_points,
        nextLevel: await expForNextLevel(totalTextData.level),
      },
    },
    voice: {
      total: {
        level: totalVoiceData.level,
        exp: totalVoiceData.level_points,
        nextLevel: await expForNextLevel(totalVoiceData.level),
      },
    },
  } as ExperienceData;

  // let response = `**Level ${totalData.level} Total**: : All experience combined\n`;
  for (const row of experienceData) { // eslint-disable-line no-restricted-syntax
    // log.debug(F, `row: ${JSON.stringify(row, null, 2)}`);
    if (
      row.type === 'TEXT' as ExperienceType
      && row.category !== 'TOTAL' as ExperienceCategory
      && row.category !== 'IGNORED' as ExperienceCategory) {
      results.text[row.category] = {
        level: row.level,
        exp: row.level_points,
        nextLevel: await expForNextLevel(row.level), // eslint-disable-line no-await-in-loop
      };
      // log.debug(F, `results.text: ${JSON.stringify(results.text, null, 2)}`);
    }
    if (
      row.type === 'VOICE' as ExperienceType
      && row.category !== 'TOTAL' as ExperienceCategory
      && row.category !== 'IGNORED' as ExperienceCategory) {
      results.voice[row.category] = {
        level: row.level,
        exp: row.level_points,
        nextLevel: await expForNextLevel(row.level), // eslint-disable-line no-await-in-loop
      };
      // log.debug(F, `results.voice: ${JSON.stringify(results.voice, null, 2)}`);
    }
    // log.debug(F, `row: ${JSON.stringify(row, null, 2)}`);
    // Lowercase besides the first letter
    // const levelName = row.category.charAt(0).toUpperCase()
    //   + row.category.slice(1).toLowerCase() as ExpTypeNames;
    // if (levelName !== 'Total') {
    //   response += `**Level ${row.level} ${levelName}**`;
    //   if (levelName === 'Tripsitter') {
    //     response += `: Harm Reduction Center category
    //     (Must have Helper role to get Sitter exp!)\n`;
    //   }
    //   if (levelName === 'Team') {
    //     response += ': TeamTripsit category\n';
    //   }
    //   if (levelName === 'Developer') {
    //     response += ': Development category\n';
    //   }
    //   if (levelName === 'General') {
    //     response += ': Campground and Backstage\n';
    //   }
    //   if (levelName === 'Ignored') {
    //     response += ': Botspam, just for fun\n';
    //   }
    // }
  }

  // log.info(F, `results: ${JSON.stringify(results, null, 2)}`);
  return results;
}
