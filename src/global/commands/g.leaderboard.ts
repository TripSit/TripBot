import { db, experienceGet, getUser } from '../utils/knex';
import { expForNextLevel, getTotalLevel } from '../utils/experience';
import { ExperienceCategory, ExperienceType, UserExperience } from '../@types/pgdb';

const F = f(__filename);

type RankData = {
  rank: number,
  discordId: string,
  level: number,
  exp: number,
  nextLevel: number,
};

type LeaderboardData = {
  [key: string]: {
    [key: string]: RankData[],
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

export async function getLeaderboard(
  categoryOption: 'TOTAL' | 'GENERAL' | 'TRIPSITTER' | 'DEVELOPER' | 'TEAM',
):Promise<LeaderboardData> {
  // Grab the text experience from the database
  const leaderboardResults = {
    text: {
      total: [] as RankData[],
      tripsitter: [] as RankData[],
      general: [] as RankData[],
      developer: [] as RankData[],
      team: [] as RankData[],
      ignored: [] as RankData[],
    },
    // voice: {
    //   total: [] as RankData[],
    //   tripsitter: [] as RankData[],
    //   general: [] as RankData[],
    //   developer: [] as RankData[],
    //   team: [] as RankData[],
    //   ignored: [] as RankData[],
    // },
  } as LeaderboardData;

  for (const type of ['TEXT'/*, 'VOICE'*/]) { // eslint-disable-line
    // log.debug(F, `type: ${type}`);
    if (categoryOption === 'TOTAL') {
      const allTextExperience = await experienceGet(10, undefined, type as ExperienceType); // eslint-disable-line
      let rank = 0;
      for (const user of allTextExperience) { // eslint-disable-line
        rank += 1;
          const userData = await getUser(null, user.user_id); // eslint-disable-line
        if (!userData) {
          log.error(F, `Could not find user with id ${user.user_id}`);
        }
        if (!userData.discord_id) {
          log.error(F, `User ${user.user_id} does not have a discord id`);
        }

        if (userData && userData.discord_id && user.total_points) {
          const totalData = await getTotalLevel(user.total_points); // eslint-disable-line

          leaderboardResults[type.toLowerCase()].total.push({
            rank,
            discordId: userData.discord_id,
            level: totalData.level,
            exp: totalData.level_points,
              nextLevel: await expForNextLevel(totalData.level), // eslint-disable-line
          });
        }
      }
    }

    if (categoryOption !== 'TOTAL') {
      // Grab the top 10 of each experience category
      for (const category of ['TRIPSITTER', 'GENERAL', 'DEVELOPER', 'TEAM']) { // eslint-disable-line
        if (categoryOption !== category) continue; // eslint-disable-line
        const userExperience = await experienceGet(10, category as ExperienceCategory, type as ExperienceType); // eslint-disable-line
        let categoryRank = 0;
        for (const user of userExperience) { // eslint-disable-line
          categoryRank += 1;
          const userData = await getUser(null, user.user_id); // eslint-disable-line
          if (!userData) {
            log.error(F, `Could not find user with id ${user.user_id}`);
          }
          if (!userData.discord_id) {
            log.error(F, `User ${user.user_id} does not have a discord id`);
          }

          if (userData && userData.discord_id && user.total_points) {
            leaderboardResults[type.toLowerCase()][category.toLowerCase()].push({
              rank: categoryRank,
              discordId: userData.discord_id,
              level: user.level,
              exp: user.level_points,
              nextLevel: await expForNextLevel(user.total_points), // eslint-disable-line
            });
          }
        }
      }
    }
  }

  // log.info(F, `response: ${JSON.stringify(leaderboardResults, null, 2)}`);

  return leaderboardResults;
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

  const userData = await getUser(discordId, null); // eslint-disable-line

  // log.debug(F, `userId: ${userData.id}`);

  let totalTextExp = 0 as number;
  let totalVoiceExp = 0 as number;

  const allExperience = await experienceGet(20, undefined, undefined, userData.id); // eslint-disable-line
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
    }
    if (experienceData.type === 'VOICE') {
      totalVoiceExp += experienceData.total_points;
    }
  }

  const totalTextRank = await db<UserExperience>('user_experience')
    .count('user_id')
    .where('total_points', '>', totalTextExp)
    .andWhere('type', 'TEXT')
    .andWhereNot('category', 'TOTAL')
    .andWhereNot('category', 'IGNORED')
    .groupBy(['user_id'])
    .sum({ total_points: 'total_points' })
    .orderBy('total_points', 'desc');

  const totalVoiceRank = await db<UserExperience>('user_experience')
    .count('user_id')
    .where('total_points', '>', totalVoiceExp)
    .andWhere('type', 'VOICE')
    .andWhereNot('category', 'TOTAL')
    .andWhereNot('category', 'IGNORED')
    .groupBy(['user_id'])
    .sum({ total_points: 'total_points' })
    .orderBy('total_points', 'desc');

  log.debug(F, `totalVoiceRank: ${totalVoiceRank.length}`);
  rankResults.TEXT.TOTAL = totalVoiceRank.length > 0
    ? parseInt(totalTextRank[0].count as string, 10) + 1
    : 0;

  log.debug(F, `totalVoiceRank: ${totalVoiceRank.length}`);
  rankResults.VOICE.TOTAL = totalVoiceRank.length > 0
    ? parseInt(totalVoiceRank[0].count as string, 10) + 1
    : 0;

  // log.debug(F, `rankResults: ${JSON.stringify(rankResults, null, 2)}`);

  return rankResults;
}
