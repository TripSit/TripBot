import {db} from '../utils/knex';
import {Users, UserExperience} from '../@types/pgdb';
import logger from '../utils/logger';
import * as path from 'path';
import {stripIndents} from 'common-tags';
const PREFIX = path.parse(__filename).name;

type rankType = {'rank': number, 'id': string, 'level': number}
type leaderboardType = {
  [key: string]: rankType[],
};
const rankDict = {
  'TOTAL': 'Overall',
  'TRIPSITTER': 'Sitters',
  'GENERAL': 'Shitposters',
  'DEVELOPER': 'Codemonkies',
  'TEAM': 'Teamtalkers',
  'IGNORED': 'Voidscreamers',
};

/**
 * Leaderboard info
 * @param {string} categoryName
 * @return {Promise<{results: leaderboardType, title: string, description: string}>}
 */
export async function leaderboard(
  categoryName: string,
):Promise<{results: leaderboardType, title: string, description: string|null}> {
  logger.debug(`[${PREFIX}] starting | category: ${categoryName}`);

  let title = `Top 15 ${rankDict[categoryName as keyof typeof rankDict]}:`;
  let description = null;
  let results = {} as leaderboardType;

  if (categoryName === 'OVERALL') {
    title = `The top three members in each category:`;
    description = stripIndents`
    **Total**        - All experience combined
    **Sitter**       - Harm Reduction Center category
    (Must have Helper role to get Sitter exp!)
    **Teamtalker**   - TeamTripsit category
    **Codemonkey**   - Development category
    **Shitposter**   - Campground and Backstage
    `;

    // Grab all the user experience from the database
    const userExperience = await db
      .select(
        db.ref('user_id').as('user_id'),
      )
      .from<UserExperience>('user_experience')
      .groupBy(['user_id'])
      .sum({total_points: 'total_points'})
      .orderBy('total_points', 'desc')
      .limit(3);

    let rank = 1;
    for (const user of userExperience) {
      const discordUser = await db
        .select(db.ref('discord_id').as('discord_id'))
        .from<Users>('users')
        .where('id', user.user_id)
        .first();

      let level = 0;
      let levelPoints = user.total_points!;
      let expToLevel = 0;
      while (levelPoints > expToLevel) {
        level++;
        expToLevel = 5 * (level ** 2) + (50 * level) + 100;
        levelPoints -= expToLevel;
      }

      if (!results['TOTAL']) {
        results['TOTAL'] = [];
      }

      results['TOTAL'].push({
        rank: rank,
        id: discordUser?.discord_id!,
        level: level,
      });
      rank++;
    };

    // Grab all the user experience from the database
    for (const category of ['TRIPSITTER', 'GENERAL', 'DEVELOPER', 'TEAM', 'IGNORED']) {
      const userExperience = await db
        .select(
          db.ref('user_id').as('user_id'),
          db.ref('level').as('level'),
        )
        .from<UserExperience>('user_experience')
        .where('type', category)
        .orderBy('total_points', 'desc')
        .limit(3);

      let rank = 1;
      for (const user of userExperience) {
        const discordUser = await db
          .select(
            db.ref('discord_id').as('discord_id'),
          )
          .from<Users>('users')
          .where('id', user.user_id)
          .first();
        if (!results[category]) {
          results[category] = [];
        }
        results[category].push({
          rank: rank,
          id: discordUser?.discord_id!,
          level: user.level,
        });
        rank++;
      }
    };
  } else if (categoryName === 'TOTAL') {
    title = 'Top 15 users in all categories';
    description = 'Total Experience is the sum of all experience in all categories.';

    // Grab all the user experience from the database
    const userExperience = await db
      .select(
        db.ref('user_id').as('user_id'),
      )
      .from<UserExperience>('user_experience')
      .groupBy(['user_id'])
      .sum({total_points: 'total_points'})
      .orderBy('total_points', 'desc')
      .limit(3);

    logger.debug(`[${PREFIX}] userExperience: ${JSON.stringify(userExperience, null, 2)}`);

    let rank = 1;
    for (const user of userExperience) {
      const discordUser = await db
        .select(
          db.ref('discord_id').as('discord_id'),
        )
        .from<Users>('users')
        .where('id', user.user_id)
        .first();


      let level = 0;
      let levelPoints = user.total_points!;
      let expToLevel = 0;
      // let i = 0;
      while (levelPoints > expToLevel) {
        level++;
        expToLevel = 5 * (level ** 2) + (50 * level) + 100;
        levelPoints -= expToLevel;
      }

      logger.debug(`[${PREFIX}] discordUser: ${JSON.stringify(discordUser)} is level ${level}`);

      if (!results['TOTAL']) {
        results['TOTAL'] = [];
      }

      results['TOTAL'].push({
        rank: rank,
        id: discordUser?.discord_id!,
        level: level,
      });
      rank++;
    };
  } else {
    // Grab all the user experience from the database
    const userExperience = await db
      .select(
        db.ref('user_id').as('user_id'),
        db.ref('level').as('level'),
      )
      .from<UserExperience>('user_experience')
      .where('type', categoryName)
      .orderBy('total_points', 'desc')
      .limit(15);

    const rankList = [] as rankType[];
    let i = 1;
    for (const user of userExperience) {
      const discordUser = await db
        .select(
          db.ref('discord_id').as('discord_id'),
        )
        .from<Users>('users')
        .where('id', user.user_id)
        .first();

      rankList.push({'rank': i, 'id': discordUser?.discord_id!, 'level': user.level});
      i++;
    };
    results = {
      [categoryName]: rankList,
    };
  }

  return {
    title,
    description,
    results,
  };
};
