import { stripIndents } from 'common-tags';
import { db, getUser } from '../utils/knex';
import { UserExperience } from '../@types/pgdb';
import { getTotalLevel } from '../utils/experience';

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
    const allUserExperience = await db<UserExperience>('user_experience')
      .select(
        db.ref('user_id'),
      )
      .andWhereNot('type', 'IGNORED')
      .whereNot('type', 'TOTAL')
      .groupBy(['user_id'])
      .sum({ total_points: 'total_points' })
      .orderBy('total_points', 'desc')
      .limit(3);

    log.debug(F, `allUserExperience: ${JSON.stringify(allUserExperience, null, 2)}`);

    let rank = 1;
    for (const user of allUserExperience) { // eslint-disable-line
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
        rank += 1;
      }
    }

    // Grab all the user experience from the database
    for (const category of ['TRIPSITTER', 'GENERAL', 'DEVELOPER', 'TEAM', 'IGNORED']) { // eslint-disable-line
      const userExperience = await db<UserExperience>('user_experience') // eslint-disable-line
        .select('*')
        .where('type', category)
        .orderBy('total_points', 'desc')
        .limit(3);

      rank = 1;
      for (const user of userExperience) { // eslint-disable-line
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
            rank,
            id: userData.discord_id,
            level: user.level,
          });
          rank += 1;
        }
      }
    }
  } else if (categoryName === 'TOTAL') {
    title = 'Top 15 users in all categories';
    description = 'Total Experience is the sum of all experience in all categories.';

    // Grab all the user experience from the database
    const userExperience = await db<UserExperience>('user_experience')
      .select(
        db.ref('user_id'),
      )
      .whereNot('type', 'IGNORED')
      .andWhereNot('type', 'TOTAL')
      .groupBy(['user_id'])
      .sum({ total_points: 'total_points' })
      .orderBy('total_points', 'desc')
      .limit(15);

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
    // Grab all the user experience from the database
    const userExperience = await db<UserExperience>('user_experience')
      .select(
        db.ref('user_id'),
        db.ref('level'),
      )
      .where('type', categoryName)
      .orderBy('total_points', 'desc')
      .limit(15);

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
