// import { stripIndents } from 'common-tags';
import {
  experienceGet,
  getUser,
  db,
  experienceGetTop,
} from '../utils/knex';
// import { getTotalLevel } from '../utils/experience';
import {
  ExperienceCategory,
  ExperienceType,
  UserExperience,
} from '../@types/database';

export default getLeaderboard;

const F = f(__filename);
// type Ranking = { 'rank': number, 'id': string, 'level': number };
// type LeaderboardType = {
//   [key: string]: Ranking[],
// };

// const rankDict = {
//   TOTAL: 'Overall',
//   TRIPSITTER: 'Trip Sitters',
//   GENERAL: 'Shit Posters',
//   DEVELOPER: 'Code Monkeys',
//   TEAM: 'Team Talkers',
//   IGNORED: 'Void Screamers',
// };

type LeaderboardList = { discord_id: string, total_points: number }[];

type LeaderboardData = {
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

type UserRankData = {
  TEXT: {
    TOTAL: number,
    TRIPSITTER: number,
    GENERAL: number,
    DEVELOPER: number,
    TEAM: number,
    IGNORED: number,
  },
  VOICE: {
    TOTAL: number,
    TRIPSITTER: number,
    GENERAL: number,
    DEVELOPER: number,
    TEAM: number,
    IGNORED: number,
  },
};

export async function getLeaderboard():Promise<LeaderboardData> {
  const leaderboard = {
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

  // Grab all the user experience from the database
  leaderboard.TEXT.TOTAL = await experienceGetTop(20, undefined, 'TEXT' as ExperienceType);
  leaderboard.TEXT.TRIPSITTER = await experienceGetTop(20, 'TRIPSITTER' as ExperienceCategory, 'TEXT' as ExperienceType); // eslint-disable-line
  leaderboard.TEXT.GENERAL = await experienceGetTop(20, 'GENERAL' as ExperienceCategory, 'TEXT' as ExperienceType); // eslint-disable-line
  leaderboard.TEXT.DEVELOPER = await experienceGetTop(20, 'DEVELOPER' as ExperienceCategory, 'TEXT' as ExperienceType); // eslint-disable-line
  leaderboard.TEXT.TEAM = await experienceGetTop(20, 'TEAM' as ExperienceCategory, 'TEXT' as ExperienceType);
  leaderboard.TEXT.IGNORED = await experienceGetTop(20, 'IGNORED' as ExperienceCategory, 'TEXT' as ExperienceType); // eslint-disable-line
  leaderboard.VOICE.TOTAL = await experienceGetTop(20, undefined, 'VOICE' as ExperienceType);
  leaderboard.VOICE.TRIPSITTER = await experienceGetTop(20, 'TRIPSITTER' as ExperienceCategory, 'VOICE' as ExperienceType); // eslint-disable-line
  leaderboard.VOICE.GENERAL = await experienceGetTop(20, 'GENERAL' as ExperienceCategory, 'VOICE' as ExperienceType); // eslint-disable-line
  leaderboard.VOICE.DEVELOPER = await experienceGetTop(20, 'DEVELOPER' as ExperienceCategory, 'VOICE' as ExperienceType); // eslint-disable-line
  leaderboard.VOICE.TEAM = await experienceGetTop(20, 'TEAM' as ExperienceCategory, 'VOICE' as ExperienceType);
  leaderboard.VOICE.IGNORED = await experienceGetTop(20, 'IGNORED' as ExperienceCategory, 'VOICE' as ExperienceType); // eslint-disable-line

  log.info(F, `leaderboard.TEXT.TOTAL: ${JSON.stringify(leaderboard.TEXT.TOTAL, null, 2)}`);
  return leaderboard;
}

export async function getRanks(
  discordId: string,
):Promise<UserRankData> {
  // Grab all the text experience from the database

  const rankResults = {
    TEXT: {
      TOTAL: 0,
      TRIPSITTER: 0,
      GENERAL: 0,
      DEVELOPER: 0,
      TEAM: 0,
      IGNORED: 0,
    },
    VOICE: {
      TOTAL: 0,
      TRIPSITTER: 0,
      GENERAL: 0,
      DEVELOPER: 0,
      TEAM: 0,
      IGNORED: 0,
    },
  } as UserRankData;

  const userData = await getUser(discordId, null);
  const experienceData = await experienceGet(undefined, undefined, undefined, userData.id);

  if (!experienceData) {
    return rankResults;
  }

  let totalTextExp = 0 as number;
  let totalVoiceExp = 0 as number;

  const allExperience = (await db<UserExperience>('user_experience')
    .join('users', 'users.id', '=', 'user_experience.user_id')
    .select(db.ref('users.discord_id'))
    .whereNot('user_experience.category', 'TOTAL')
    .andWhereNot('user_experience.category', 'IGNORED')
    .andWhere('user_experience.type', 'TEXT')
    .groupBy(['users.discord_id'])
    .sum({ total_points: 'user_experience.total_points' })
    .orderBy('total_points', 'desc')) as UserExperience[];

  for (const experienceData of allExperience) { // eslint-disable-line
    // log.debug(F, `experienceData: ${JSON.stringify(experienceData, null, 2)}`);

    // Get the count of people in that rank
    const categoryRank = await db<UserExperience>('user_experience') // eslint-disable-line
      .count('user_id')
      .where('category', experienceData.category)
      .andWhere('type', experienceData.type)
      .andWhere('total_points', '>', experienceData.total_points);

    rankResults[experienceData.type][experienceData.category] = parseInt(categoryRank[0].count as string, 10) + 1;

    if (experienceData.type === 'TEXT') {
      totalTextExp += experienceData.total_points;
      // log.debug(F, `totalTextExp: ${totalTextExp} incremented by ${experienceData.total_points}`);
    }
    if (experienceData.type === 'VOICE') {
      totalVoiceExp += experienceData.total_points;
    }
  }

  const totalTextRank = await db<UserExperience>('user_experience')
    .count('user_id')
    .where('type', 'TEXT')
    .andWhereNot('category', 'TOTAL')
    .andWhereNot('category', 'IGNORED')
    .andWhere('total_points', '>', totalTextExp)
    .groupBy(['user_id'])
    .sum({ total_points: 'total_points' })
    .orderBy('total_points', 'desc');

  // log.debug(F, `totalTextRank: ${totalTextRank.length}`);
  // log.debug(F, `totalTextRank: ${JSON.stringify(totalTextRank, null, 2)}`);
  rankResults.TEXT.TOTAL = totalTextRank.length > 0
    ? totalTextRank.length + 1
    : 1;

  // totalTextRank.forEach(async user => {
  //   // log.debug(F, `user: ${JSON.stringify(user, null, 2)}`);
  //   const userData = await getUser(null, user.user_id); // eslint-disable-line
  //   log.debug(F, `discordId: ${JSON.stringify(userData.discord_id, null, 2)}`);
  // });

  const totalVoiceRank = await db<UserExperience>('user_experience')
    .count('user_id')
    .where('type', 'VOICE')
    .andWhereNot('category', 'TOTAL')
    .andWhereNot('category', 'IGNORED')
    .andWhere('total_points', '>', totalVoiceExp)
    .groupBy(['user_id'])
    .sum({ total_points: 'total_points' })
    .orderBy('total_points', 'desc');

  // log.debug(F, `totalVoiceRank: ${totalVoiceRank.length}`);
  rankResults.VOICE.TOTAL = totalVoiceRank.length > 0
    ? totalVoiceRank.length + 1
    : 0;

  // log.debug(F, `rankResults: ${JSON.stringify(rankResults, null, 2)}`);

  return rankResults;
}
