/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
/* eslint-disable sonarjs/no-identical-functions */
import { experience_category, experience_type } from '@db/tripbot';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const F = f(__filename);

type LeaderboardList = { discord_id: string, total_points: number }[];

type LeaderboardData = {
  ALL: Record<experience_category | 'TOTAL', LeaderboardList>,
  TEXT: Record<experience_category | 'TOTAL', LeaderboardList>,
  VOICE: Record<experience_category | 'TOTAL', LeaderboardList>,
};

export async function leaderboardV2(): Promise<LeaderboardData> {
  // Function to initialize leaderboard data structure for each type
  const initLeaderboardData = () => ({
    TOTAL: [],
    TRIPSITTER: [],
    GENERAL: [],
    DEVELOPER: [],
    TEAM: [],
    IGNORED: [],
  });

  // Initialize leaderboard data with structures for ALL, TEXT, and VOICE
  const leaderboardData: LeaderboardData = {
    ALL: initLeaderboardData(),
    TEXT: initLeaderboardData(),
    VOICE: initLeaderboardData(),
  };

  // Define categories, including 'TOTAL' as a special category
  const categories: (experience_category | 'TOTAL')[] = [
    'TOTAL',
    experience_category.TRIPSITTER,
    experience_category.GENERAL,
    experience_category.DEVELOPER,
    experience_category.TEAM,
  ];

  // Define types, including 'ALL' as a special type
  const types: (experience_type | 'ALL')[] = [
    'ALL',
    experience_type.TEXT,
    experience_type.VOICE,
  ];

  // Create an array of promises for each type-category combination
  const queries = types.flatMap(type => categories.map(async category => {
    // Initialize whereClause for the database query
    const whereClause: {
      type?: experience_type,
      category?: experience_category,
      NOT?: { category: experience_category }[],
    } = {};
    if (category !== 'TOTAL') whereClause.category = category;
    if (type !== 'ALL') whereClause.type = type;
    whereClause.NOT = [{ category: 'IGNORED' }, { category: 'TOTAL' }];

    // Perform the database query

    let userList = [] as LeaderboardList;

    if (category !== 'TOTAL') {
      // Perform the database query
      userList = await db.user_experience.findMany({
        where: whereClause,
        orderBy: { total_points: 'desc' },
        include: { users: { select: { discord_id: true } } },
      })
        .then(results => results.map(result => ({
          discord_id: result.users.discord_id,
          total_points: result.total_points,
        }))) as LeaderboardList;
    } else {
      const userExpData = await db.user_experience.groupBy({
        by: ['user_id'],
        where: whereClause,
        _sum: {
          total_points: true,
        },
      });

      // Sort the list so that the highest points are first
      userExpData.sort((a, b) => {
        const pointsA = a._sum.total_points ?? 0; // Use 0 if total_points is null
        const pointsB = b._sum.total_points ?? 0; // Use 0 if total_points is null
        return pointsB - pointsA;
      });

      // Extract the user IDs from the now ordered list
      const userIdList = userExpData.map(user => user.user_id);

      // Fetch users with the corresponding user IDs
      const users = await db.users.findMany({
        where: {
          id: {
            in: userIdList,
          },
        },
        select: {
          id: true,
          discord_id: true,
        },
      });

      // Create a map of user IDs to discord IDs
      const userIdMap = new Map<string, string>();
      users.forEach(user => userIdMap.set(user.id, user.discord_id || ''));

      // Populate the user list with the discord IDs
      userList = userExpData.map(user => ({
        discord_id: userIdMap.get(user.user_id) || '',
        total_points: user._sum.total_points || 0,
      }));
    }

    // Assign the results to the appropriate place in the leaderboard data
    leaderboardData[type][category] = userList;
  }));

  // Wait for all the database queries to complete
  await Promise.all(queries);

  // log.debug(F, `leaderboardData: ${JSON.stringify(leaderboardData.ALL.DEVELOPER.slice(0, 20), null, 2)}`);

  // Return the populated leaderboard data
  return leaderboardData;
}

export default leaderboardV2;
