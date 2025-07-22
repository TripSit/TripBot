import { experience_category, experience_type } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const F = f(__filename);

interface LeaderboardData {
  ALL: Record<'TOTAL' | experience_category, LeaderboardList>;
  TEXT: Record<'TOTAL' | experience_category, LeaderboardList>;
  VOICE: Record<'TOTAL' | experience_category, LeaderboardList>;
}

type LeaderboardList = { discord_id: string; total_points: number }[];

export async function leaderboardV2(): Promise<LeaderboardData> {
  // Function to initialize leaderboard data structure for each type
  const initLeaderboardData = () => ({
    DEVELOPER: [],
    GENERAL: [],
    IGNORED: [],
    TEAM: [],
    TOTAL: [],
    TRIPSITTER: [],
  });

  // Initialize leaderboard data with structures for ALL, TEXT, and VOICE
  const leaderboardData: LeaderboardData = {
    ALL: initLeaderboardData(),
    TEXT: initLeaderboardData(),
    VOICE: initLeaderboardData(),
  };

  // Define categories, including 'TOTAL' as a special category
  const categories: ('TOTAL' | experience_category)[] = [
    'TOTAL',
    experience_category.TRIPSITTER,
    experience_category.GENERAL,
    experience_category.DEVELOPER,
    experience_category.TEAM,
  ];

  // Define types, including 'ALL' as a special type
  const types: ('ALL' | experience_type)[] = ['ALL', experience_type.TEXT, experience_type.VOICE];

  // Create an array of promises for each type-category combination
  const queries = types.flatMap((type) =>
    categories.map(async (category) => {
      // Initialize whereClause for the database query
      const whereClause: {
        category?: experience_category;
        NOT?: { category: experience_category }[];
        type?: experience_type;
      } = {};
      if (category !== 'TOTAL') {
        whereClause.category = category;
      }
      if (type !== 'ALL') {
        whereClause.type = type;
      }
      whereClause.NOT = [{ category: 'IGNORED' }, { category: 'TOTAL' }];

      // Perform the database query

      let userList = [] as LeaderboardList;

      if (category === 'TOTAL') {
        const userExpData = await db.user_experience.groupBy({
          _sum: {
            total_points: true,
          },
          by: ['user_id'],
          where: whereClause,
        });

        // Sort the list so that the highest points are first
        userExpData.sort((a, b) => {
          const pointsA = a._sum.total_points ?? 0; // Use 0 if total_points is null
          const pointsB = b._sum.total_points ?? 0; // Use 0 if total_points is null
          return pointsB - pointsA;
        });

        // Extract the user IDs from the now ordered list
        const userIdList = userExpData.map((user) => user.user_id);

        // Fetch users with the corresponding user IDs
        const users = await db.users.findMany({
          select: {
            discord_id: true,
            id: true,
          },
          where: {
            id: {
              in: userIdList,
            },
          },
        });

        // Create a map of user IDs to discord IDs
        const userIdMap = new Map<string, string>();
        for (const user of users) {
          userIdMap.set(user.id, user.discord_id || '');
        }

        // Populate the user list with the discord IDs
        userList = userExpData.map((user) => ({
          discord_id: userIdMap.get(user.user_id) || '',
          total_points: user._sum.total_points || 0,
        }));
      } else {
        // Perform the database query
        userList = (await db.user_experience
          .findMany({
            include: { users: { select: { discord_id: true } } },
            orderBy: { total_points: 'desc' },
            where: whereClause,
          })
          .then((results) =>
            results.map((result) => ({
              discord_id: result.users.discord_id,
              total_points: result.total_points,
            })),
          )) as LeaderboardList;
      }

      // Assign the results to the appropriate place in the leaderboard data
      leaderboardData[type][category] = userList;
    }),
  );

  // Wait for all the database queries to complete
  await Promise.all(queries);

  // log.debug(F, `leaderboardData: ${JSON.stringify(leaderboardData.ALL.DEVELOPER.slice(0, 20), null, 2)}`);

  // Return the populated leaderboard data
  return leaderboardData;
}

export default leaderboardV2;
