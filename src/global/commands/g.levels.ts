/* eslint-disable no-await-in-loop, no-restricted-syntax, no-continue */
import { experience_category, experience_type } from '@prisma/client';
import {
  expForNextLevel,
  getTotalLevel,
} from '../utils/experience';

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

type LeaderboardList = { discord_id: string, total_points: number }[];

type LeaderboardData = {
  ALL: {
    TOTAL: LeaderboardList,
    TRIPSITTER: LeaderboardList,
    GENERAL: LeaderboardList,
    DEVELOPER: LeaderboardList,
    TEAM: LeaderboardList,
    IGNORED: LeaderboardList,
  },
  TEXT: {
    TOTAL: LeaderboardList,
    TRIPSITTER: LeaderboardList,
    GENERAL: LeaderboardList,
    DEVELOPER: LeaderboardList,
    TEAM: LeaderboardList,
    IGNORED: LeaderboardList,
  },
  VOICE: {
    TOTAL: LeaderboardList,
    TRIPSITTER: LeaderboardList,
    GENERAL: LeaderboardList,
    DEVELOPER: LeaderboardList,
    TEAM: LeaderboardList,
    IGNORED: LeaderboardList,
  },
};

export async function levels(
  discordId: string,
):Promise<LevelData> {
  const leaderboardData = {
    ALL: {
      TOTAL: [],
      TRIPSITTER: [],
      GENERAL: [],
      DEVELOPER: [],
      TEAM: [],
      IGNORED: [],
    },
    TEXT: {
      TOTAL: [],
      TRIPSITTER: [],
      GENERAL: [],
      DEVELOPER: [],
      TEAM: [],
      IGNORED: [],
    },
    VOICE: {
      TOTAL: [],
      TRIPSITTER: [],
      GENERAL: [],
      DEVELOPER: [],
      TEAM: [],
      IGNORED: [],
    },
  } as LeaderboardData;

  const categories: experience_category[] = [
    experience_category.TRIPSITTER,
    experience_category.GENERAL,
    experience_category.DEVELOPER,
    experience_category.TEAM,
    experience_category.IGNORED,
  ];
  const types: experience_type[] = [
    experience_type.TEXT,
    experience_type.VOICE,
  ];

  // eslint-disable-next-line no-restricted-syntax
  for (const type of ['ALL', ...types]) {
  // eslint-disable-next-line no-restricted-syntax
    for (const category of ['TOTAL', ...categories]) {
      const lookupType = type as experience_type | 'ALL';
      const lookupCategory = category as experience_category | 'TOTAL';

      const whereClause = {} as {
        type?: experience_type,
        category?: experience_category,
      };

      if (lookupCategory !== 'TOTAL') {
        whereClause.category = lookupCategory;
      }

      if (lookupType !== 'ALL') {
        whereClause.type = lookupType;
      }

      const users = await db.user_experience.findMany({
        where: whereClause,
        orderBy: {
          total_points: 'desc',
        },
        include: {
          users: {
            select: {
              discord_id: true,
            },
          },
        },
      });

      const userList = users.map(user => ({
        discord_id: user.users.discord_id,
        total_points: user.total_points,
      })) as LeaderboardList;

      leaderboardData[type as experience_type][category as experience_category] = userList;
    }
  }

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
