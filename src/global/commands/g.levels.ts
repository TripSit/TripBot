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

type LeaderboardData = Awaited<ReturnType<typeof leaderboardV2>>;

const emptyLevelEntry = () => ({
  level: 0,
  level_exp: 0,
  nextLevel: 0,
  total_exp: 0,
  rank: 0,
});

/** Fills in this user's level for every leaderboard they appear in, returning the "type.category" keys they are in. */
async function fillUserLevels(
  leaderboardData: LeaderboardData,
  discordId: string,
  results: LevelData,
): Promise<Set<string>> {
  const participatingKeys = new Set<string>();

  for (const type of Object.keys(leaderboardData)) { // eslint-disable-line no-restricted-syntax
    const typeKey = type as keyof typeof leaderboardData;
    const typeData = leaderboardData[typeKey];
    for (const category of Object.keys(typeData)) {
      const categoryKey = category as keyof typeof typeData;
      const categoryData = typeData[categoryKey];
      const userRank = categoryData.findIndex(user => user.discord_id === discordId);
      if (userRank === -1) continue; // eslint-disable-line no-continue
      const userExperience = categoryData[userRank];
      const levelData = await getTotalLevel(userExperience.total_points); // eslint-disable-line no-await-in-loop
      const nextLevel = await expForNextLevel(levelData.level); // eslint-disable-line no-await-in-loop
      results[typeKey][categoryKey] = { // eslint-disable-line no-param-reassign
        level: levelData.level,
        level_exp: levelData.level_points,
        nextLevel,
        total_exp: userExperience.total_points,
        rank: userRank + 1, // 0-based to 1-based
      };
      participatingKeys.add(`${typeKey}.${categoryKey}`);
    }
  }
  return participatingKeys;
}

/**
 * If this user's level is frozen, pin the displayed level of the categories they appear in, plus
 * the headline totals. Categories they have no XP in are left alone. Ranks are left as-is.
 */
async function applyLevelFreeze(
  leaderboardData: LeaderboardData,
  results: LevelData,
  frozenLevel: number,
  participatingKeys: Set<string>,
): Promise<void> {
  const frozenNextLevel = await expForNextLevel(frozenLevel);
  const alwaysFrozenKeys = ['ALL.TOTAL', 'TEXT.TOTAL'];
  for (const type of Object.keys(leaderboardData)) { // eslint-disable-line no-restricted-syntax
    const typeKey = type as keyof typeof leaderboardData;
    for (const category of Object.keys(leaderboardData[typeKey])) {
      const key = `${typeKey}.${category}`;
      if (!participatingKeys.has(key) && !alwaysFrozenKeys.includes(key)) continue; // eslint-disable-line no-continue
      const existing = results[typeKey][category];
      results[typeKey][category] = { // eslint-disable-line no-param-reassign
        level: frozenLevel,
        level_exp: frozenNextLevel,
        nextLevel: frozenNextLevel,
        total_exp: existing ? existing.total_exp : 0,
        rank: existing ? existing.rank : 0,
      };
    }
  }
}

export async function levels(
  discordId: string,
):Promise<LevelData> {
  const leaderboardData = await leaderboardV2();

  // This user's level freeze, if any. Applied to every displayed level in the pass below.
  const frozenLevel = await getLevelFreeze(discordId);

  const results = {
    ALL: { TOTAL: emptyLevelEntry() },
    TEXT: { TOTAL: emptyLevelEntry() },
    VOICE: { TOTAL: emptyLevelEntry() },
  } as LevelData;

  const participatingKeys = await fillUserLevels(leaderboardData, discordId, results);

  if (frozenLevel !== null) {
    await applyLevelFreeze(leaderboardData, results, frozenLevel, participatingKeys);
  }

  log.debug(F, `results: ${JSON.stringify(results, null, 2)}`);

  return results;
}
