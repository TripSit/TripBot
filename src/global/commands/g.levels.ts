/* eslint-disable no-await-in-loop, no-restricted-syntax, no-continue */
import {
  expForNextLevel,
  getTotalLevel,
} from '../utils/experience';
import { getLeaderboard } from './g.leaderboard';

export default levels;

const F = f(__filename); // eslint-disable-line

type LevelData = {
  ALL: {
    TOTAL: {
      level: number,
      level_exp: number,
      nextLevel: number,
      total_exp: number,
      rank: number,
    },
    [key: string]: {
      level: number,
      level_exp: number,
      nextLevel: number,
      total_exp: number,
      rank: number,
    },
  },
  TEXT: {
    TOTAL: {
      level: number,
      level_exp: number,
      nextLevel: number,
      total_exp: number,
      rank: number,
    },
    [key: string]: {
      level: number,
      level_exp: number,
      nextLevel: number,
      total_exp: number,
      rank: number,
    },
  },
  VOICE: {
    TOTAL: {
      level: number,
      level_exp: number,
      nextLevel: number,
      total_exp: number,
      rank: number,
    },
    [key: string]: {
      level: number,
      level_exp: number,
      nextLevel: number,
      total_exp: number,
      rank: number,
    },
  },
};

export async function levels(
  discordId: string,
):Promise<LevelData> {
  const leaderboardData = await getLeaderboard();

  const results = {
    ALL: {
      TOTAL: {
        level: 0,
        level_exp: 0,
        nextLevel: 0,
        total_exp: 0,
        rank: 0,
      },
    },
    TEXT: {
      TOTAL: {
        level: 0,
        level_exp: 0,
        nextLevel: 0,
        total_exp: 0,
        rank: 0,
      },
    },
    VOICE: {
      TOTAL: {
        level: 0,
        level_exp: 0,
        nextLevel: 0,
        total_exp: 0,
        rank: 0,
      },
    },
  } as LevelData;

  for (const type of Object.keys(leaderboardData)) { // eslint-disable-line no-restricted-syntax
    const typeKey = type as keyof typeof leaderboardData;
    const typeData = leaderboardData[typeKey];
    // log.debug(F, `typeKey: ${typeKey}, typeData: ${JSON.stringify(typeData, null, 2)}`);
    for (const category of Object.keys(typeData)) {
      const categoryKey = category as keyof typeof typeData;
      const categoryData = typeData[categoryKey];

      // log.debug(F, `categoryKey: ${categoryKey}, categoryData: ${JSON.stringify(categoryData, null, 2)}`);
      if (categoryData.length === 0) {
        continue;
      }
      const userRank = categoryData.findIndex(user => user.discord_id === discordId);
      // log.debug(F, `userRank: ${userRank}`);
      if (userRank === -1) {
        continue;
      }
      const userExperience = categoryData[userRank];
      // log.debug(F, `userExperience: ${JSON.stringify(userExperience, null, 2)}`);
      const levelData = await getTotalLevel(userExperience.total_points);
      // log.debug(F, `levelData: ${JSON.stringify(levelData, null, 2)}`);
      const nextLevel = await expForNextLevel(levelData.level);
      // log.debug(F, `nextLevel: ${nextLevel}`);
      results[typeKey][categoryKey] = {
        level: levelData.level,
        level_exp: levelData.level_points,
        nextLevel,
        total_exp: userExperience.total_points,
        rank: userRank + 1,
      };
    }
  }

  // log.debug(F, `results: ${JSON.stringify(results, null, 2)}`);

  return results;
}
