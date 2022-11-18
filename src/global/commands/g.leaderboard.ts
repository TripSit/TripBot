import { parse } from 'path';
import { stripIndents } from 'common-tags';
import { db, getUser } from '../utils/knex';
import { UserExperience } from '../@types/pgdb';
import log from '../utils/log';

const PREFIX = parse(__filename).name;

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
    let userExperience = await db<UserExperience>('user_experience')
      .select(
        db.ref('user_id'),
      )
      .groupBy(['user_id'])
      .sum({ total_points: 'total_points' })
      .orderBy('total_points', 'desc')
      .limit(3);

    let rank = 1;
    // for (const user of userExperience) {
    userExperience.forEach(async (user) => {
      const userData = await getUser(null, user.user_id);
      if (!userData) {
        log.error(`[${PREFIX}] Could not find user with id ${user.user_id}`);
      }
      if (!userData.discord_id) {
        log.error(`[${PREFIX}] User ${user.user_id} does not have a discord id`);
      }

      if (userData && userData.discord_id && user.total_points) {
        let level = 0;
        let levelPoints = user.total_points;
        let expToLevel = 0;
        while (levelPoints > expToLevel) {
          level += 1;
          expToLevel = 5 * (level ** 2) + (50 * level) + 100;
          levelPoints -= expToLevel;
        }

        if (!results.TOTAL) {
          results.TOTAL = [];
        }

        results.TOTAL.push({
          rank,
          id: userData.discord_id,
          level,
        });
        rank += 1;
      }
    });

    // Grab all the user experience from the database
    // for (const category of ['TRIPSITTER', 'GENERAL', 'DEVELOPER', 'TEAM', 'IGNORED']) {
    ['TRIPSITTER', 'GENERAL', 'DEVELOPER', 'TEAM', 'IGNORED'].forEach(async (category) => {
      userExperience = await db<UserExperience>('user_experience')
        .select(
          db.ref('user_id'),
          db.ref('level'),
        )
        .where('type', category)
        .orderBy('total_points', 'desc')
        .limit(3);

      rank = 1;
      // for (const user of userExperience) {
      userExperience.forEach(async (user) => {
        const userData = await getUser(null, user.user_id);
        if (!userData) {
          log.error(`[${PREFIX}] Could not find user with id ${user.user_id}`);
        }
        if (!userData.discord_id) {
          log.error(`[${PREFIX}] User ${user.user_id} does not have a discord id`);
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
      });
    });
  } else if (categoryName === 'TOTAL') {
    title = 'Top 15 users in all categories';
    description = 'Total Experience is the sum of all experience in all categories.';

    // Grab all the user experience from the database
    const userExperience = await db<UserExperience>('user_experience')
      .select(
        db.ref('user_id'),
      )
      .groupBy(['user_id'])
      .sum({ total_points: 'total_points' })
      .orderBy('total_points', 'desc')
      .limit(3);

    // log.debug(`[${PREFIX}] userExperience: ${JSON.stringify(userExperience, null, 2)}`);

    let rank = 1;
    // for (const user of userExperience) {
    userExperience.forEach(async (user) => {
      const userData = await getUser(null, user.user_id);
      if (!userData) {
        log.error(`[${PREFIX}] Could not find user with id ${user.user_id}`);
      }
      if (!userData.discord_id) {
        log.error(`[${PREFIX}] User ${user.user_id} does not have a discord id`);
      }
      if (!user.total_points) {
        log.error(`[${PREFIX}] User ${user.user_id} has no total points`);
      }

      if (userData && userData.discord_id && user.total_points) {
        let level = 0;
        let levelPoints = user.total_points;
        let expToLevel = 0;
        // let i = 0;
        while (levelPoints > expToLevel) {
          level += 1;
          expToLevel = 5 * (level ** 2) + (50 * level) + 100;
          levelPoints -= expToLevel;
        }

        // log.debug(`[${PREFIX}] discordUser: ${JSON.stringify(userData)} is level ${level}`);

        if (!results.TOTAL) {
          results.TOTAL = [];
        }

        results.TOTAL.push({
          rank,
          id: userData.discord_id,
          level,
        });
        rank += 1;
      }
    });
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

    const rankList = [] as RankType[];
    let i = 1;
    // for (const user of userExperience) {
    userExperience.forEach(async (user) => {
      const userData = await getUser(null, user.user_id);
      if (!userData) {
        log.error(`[${PREFIX}] Could not find user with id ${user.user_id}`);
      }
      if (!userData.discord_id) {
        log.error(`[${PREFIX}] User ${user.user_id} does not have a discord id`);
      }

      if (userData && userData.discord_id) {
        rankList.push({ rank: i, id: userData.discord_id, level: user.level });
        i += 1;
      }
    });
    results = {
      [categoryName]: rankList,
    };
  }

  const response = {
    title,
    description,
    results,
  };
  log.info(`[${PREFIX}] response: ${JSON.stringify(response, null, 2)}`);

  return response;
}
