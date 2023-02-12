import { stripIndents } from 'common-tags';
import {
  experienceGet, getUser, db,
} from '../utils/knex';
import { getTotalLevel } from '../utils/experience';
import {
  ExperienceCategory, ExperienceType, UserExperience,
} from '../@types/pgdb';

const F = f(__filename);

type RankType = { 'rank': number, 'id': string, 'level': number };
type LeaderboardType = {
  [key: string]: RankType[],
};
const rankDict = {
  TOTAL: 'Overall',
  TRIPSITTER: 'Sitters',
  GENERAL: 'Shitposters',
  DEVELOPER: 'Codemonkies',
  TEAM: 'Teamtalkers',
  IGNORED: 'Voidscreamers',
};

// type RankData = {
//   rank: number,
//   discordId: string,
//   level: number,
//   exp: number,
//   nextLevel: number,
// };

// type LeaderboardData = {
//   [key: string]: {
//     [key: string]: RankData[],
//   },
// };

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
export default leaderboard;

/**
 * Leaderboard info
 * @param {string} categoryName
 * @return {Promise<{results: LeaderboardType, title: string, description: string}>}
 */
export async function leaderboard(
  categoryName: string,
):Promise<{ results: LeaderboardType, title: string, description: string | null }> {
  let title = `Top 15 ${rankDict[categoryName as keyof typeof rankDict]}:`;
  let description = null;
  let results = {} as LeaderboardType;

  if (categoryName === 'OVERALL') {
    title = 'The top three members in each category:';
    description = stripIndents`
    **Total**        - All experience combined
    **Sitter**       - Harm Reduction Center category
    (Must have Helper role to get Sitter exp!)
    **Teamtalker**   - TeamTripsit category
    **Codemonkey**   - Development category
    **Shitposter**   - Campground and Backstage
    `;

    // Grab all the user experience from the database
    const allUserExperience = await experienceGet(3, undefined, 'TEXT' as ExperienceType, undefined);

    // log.debug(F, `allUserExperience: ${JSON.stringify(allUserExperience, null, 2)}`);

    let rank = 0;
    for (const user of allUserExperience) { // eslint-disable-line
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

        if (!results.TOTAL) {
          results.TOTAL = [];
        }

        results.TOTAL.push({
          rank,
          id: userData.discord_id,
          level: totalData.level,
        });
      }
    }

    // Grab the top three of each experience category
    for (const category of ['TRIPSITTER', 'GENERAL', 'DEVELOPER', 'TEAM', 'IGNORED']) { // eslint-disable-line
      const userExperience = await experienceGet(3, category as ExperienceCategory, 'TEXT' as ExperienceType, undefined);// eslint-disable-line
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
          if (!results[category]) {
            results[category] = [];
          }
          results[category].push({
            rank: categoryRank,
            id: userData.discord_id,
            level: user.level,
          });
        }
      }
    }
  } else if (categoryName === 'TOTAL') {
    title = 'Top 15 users in all categories';
    description = 'Total Experience is the sum of all experience in all categories.';

    // Grab all the user experience from the database
    const userExperience = await experienceGet(15, undefined, undefined, undefined);

    // log.debug(F, `userExperience: ${JSON.stringify(userExperience, null, 2)}`);

    let rank = 1;
    for (const user of userExperience) { // eslint-disable-line
    // userExperience.forEach(async user => {
      const userData = await getUser(null, user.user_id); // eslint-disable-line
      if (!userData) {
        log.error(F, `Could not find user with id ${user.user_id}`);
      }
      if (!userData.discord_id) {
        log.error(F, `User ${user.user_id} does not have a discord id`);
      }
      if (!user.total_points) {
        log.error(F, `User ${user.user_id} has no total points`);
      }

      if (userData && userData.discord_id && user.total_points) {
        const totalData = await getTotalLevel(user.total_points); // eslint-disable-line

        if (!results.TOTAL) {
          results.TOTAL = [];
        }

        results.TOTAL.push({
          rank,
          id: userData.discord_id,
          level: totalData.level,
        });
        rank += 1;
      }
    }
  } else {
    // Grab top 15 of that category

    const userExperience = await experienceGet(15, categoryName as ExperienceCategory, 'TEXT' as ExperienceType, undefined);

    // log.debug(F, `userExperience: ${JSON.stringify(userExperience, null, 2)}`);

    const rankList = [] as RankType[];
    let i = 1;
    for (const user of userExperience) { // eslint-disable-line
    // userExperience.forEach(async user => {
      const userData = await getUser(null, user.user_id); // eslint-disable-line
      if (!userData) {
        log.error(F, `Could not find user with id ${user.user_id}`);
      }
      if (!userData.discord_id) {
        log.error(F, `User ${user.user_id} does not have a discord id`);
      }
      // log.debug(F, `userData: ${JSON.stringify(userData)}`);

      if (userData && userData.discord_id) {
        rankList.push({ rank: i, id: userData.discord_id, level: user.level });
        i += 1;
      }
    }
    // log.debug(F, `rankList: ${JSON.stringify(rankList, null, 2)}`);
    results = {
      [categoryName]: rankList,
    };
  }

  const response = {
    title,
    description,
    results,
  };
  log.info(F, `response: ${JSON.stringify(response, null, 2)}`);

  return response;
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
  const experienceData = await experienceGet(10, undefined, undefined, userData.id);

  if (!experienceData) {
    return rankResults;
  }

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
    .where('total_points', '>', totalVoiceExp)
    .andWhere('type', 'VOICE')
    .andWhereNot('category', 'TOTAL')
    .andWhereNot('category', 'IGNORED')
    .groupBy(['user_id'])
    .sum({ total_points: 'total_points' })
    .orderBy('total_points', 'desc');

  log.debug(F, `totalVoiceRank: ${totalVoiceRank.length}`);
  rankResults.VOICE.TOTAL = totalVoiceRank.length > 0
    ? totalVoiceRank.length + 1
    : 0;

  // log.debug(F, `rankResults: ${JSON.stringify(rankResults, null, 2)}`);

  return rankResults;
}
