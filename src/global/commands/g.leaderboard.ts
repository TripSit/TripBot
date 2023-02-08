import { experienceGet, getUser } from '../utils/knex';
import { expForNextLevel, getTotalLevel } from '../utils/experience';
import { ExperienceCategory, ExperienceType } from '../@types/pgdb';

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

export default leaderboard;

/**
 * Leaderboard info
 * @param {string} categoryName
 * @return {Promise<{results: LeaderboardType, title: string, description: string}>}
 */
export async function leaderboard():Promise<typeof leaderboardResults> {
  // Grab all the text experience from the database

  const leaderboardResults = {
    text: {
      total: [] as RankData[],
      tripsitter: [] as RankData[],
      general: [] as RankData[],
      developer: [] as RankData[],
      team: [] as RankData[],
      ignored: [] as RankData[],
    },
    voice: {
      total: [] as RankData[],
      tripsitter: [] as RankData[],
      general: [] as RankData[],
      developer: [] as RankData[],
      team: [] as RankData[],
      ignored: [] as RankData[],
    },
  } as LeaderboardData;

  for (const type of ['TEXT', 'VOICE']) { // eslint-disable-line
    // log.debug(F, `type: ${type}`);
    const allTextExperience = await experienceGet(15, undefined, type as ExperienceType, undefined); // eslint-disable-line
    // log.debug(F, `allTextExperience: ${JSON.stringify(allTextExperience, null, 2)}`);
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
    // Grab the top three of each experience category
    for (const category of ['TRIPSITTER', 'GENERAL', 'DEVELOPER', 'TEAM', 'IGNORED']) { // eslint-disable-line
      const userExperience = await experienceGet(3, category as ExperienceCategory, type as ExperienceType, undefined);// eslint-disable-line
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

  log.info(F, `response: ${JSON.stringify(leaderboardResults, null, 2)}`);

  return leaderboardResults;
}
