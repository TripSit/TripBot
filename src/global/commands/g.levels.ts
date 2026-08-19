/* eslint-disable no-await-in-loop, no-restricted-syntax, no-continue */
import {
  expForNextLevel,
  getTotalLevel,
} from '../utils/experience';

import { leaderboardV2 } from './g.leaderboard';
import { getLevelFreeze } from './g.levelFreeze';

export default levels;

const F = f(__filename);

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
  const leaderboardData = await leaderboardV2();

  // This user's level freeze, if any. Applied to every displayed level in the pass below.
  const frozenLevel = await getLevelFreeze(discordId);

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

  const participatingKeys = new Set<string>();

  for (const type of Object.keys(leaderboardData)) { // eslint-disable-line no-restricted-syntax
    const typeKey = type as keyof typeof leaderboardData;
    const typeData = leaderboardData[typeKey];
    for (const category of Object.keys(typeData)) {
      const categoryKey = category as keyof typeof typeData;
      const categoryData = typeData[categoryKey];

      if (categoryData.length === 0) {
        continue;
      }

      const userRank = categoryData.findIndex(user => user.discord_id === discordId);
      if (userRank === -1) continue;
      const userExperience = categoryData.find(user => user.discord_id === discordId);
      if (!userExperience) continue;
      const levelData = await getTotalLevel(userExperience.total_points);
      const nextLevel = await expForNextLevel(levelData.level);
      results[typeKey][categoryKey] = {
        level: levelData.level,
        level_exp: levelData.level_points,
        nextLevel,
        total_exp: userExperience.total_points,
        rank: userRank + 1, // 0-based to 1-based
      };
      participatingKeys.add(`${typeKey}.${categoryKey}`);
    }
  }

  // If this user's level is frozen, pin the displayed level of the categories they appear in, plus
  // the headline totals. Categories they have no XP in are left alone. Ranks are left as-is.
  if (frozenLevel !== null) {
    const frozenNextLevel = await expForNextLevel(frozenLevel);
    const alwaysFrozenKeys = ['ALL.TOTAL', 'TEXT.TOTAL'];
    for (const type of Object.keys(leaderboardData)) {
      const typeKey = type as keyof typeof leaderboardData;
      for (const category of Object.keys(leaderboardData[typeKey])) {
        const key = `${typeKey}.${category}`;
        if (participatingKeys.has(key) || alwaysFrozenKeys.includes(key)) {
          const existing = results[typeKey][category];
          results[typeKey][category] = {
            level: frozenLevel,
            level_exp: frozenNextLevel,
            nextLevel: frozenNextLevel,
            total_exp: existing ? existing.total_exp : 0,
            rank: existing ? existing.rank : 0,
          };
        }
      }
    }
  }

  log.debug(F, `results: ${JSON.stringify(results, null, 2)}`);

  return results;
}
