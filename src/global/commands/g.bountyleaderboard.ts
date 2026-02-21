interface BountyStats {
  userId: string;
  username: string;
  totalBounties: number;
  totalXP: number;
}

export async function getBountyStats(): Promise<BountyStats[]> {
  try {
    const rawData = await db.claimed_bounties.findMany({
      select: {
        user_id: true,
        amount: true,
      },
    });

    if (rawData.length === 0) {
      return [];
    }

    // Try the groupBy approach first
    const bountyData = await db.claimed_bounties.groupBy({
      by: ['user_id'],
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    });

    if (bountyData.length === 0) {
      // Manual aggregation fallback
      const userStats = new Map<string, { count: number; totalXP: number }>();

      rawData.forEach(record => {
        const existing = userStats.get(record.user_id) || { count: 0, totalXP: 0 };
        userStats.set(record.user_id, {
          count: existing.count + 1,
          totalXP: existing.totalXP + (record.amount || 0),
        });
      });

      const stats: BountyStats[] = Array.from(userStats.entries()).map(([userId, data]) => ({
        userId,
        username: `<@${userId}>`,
        totalBounties: data.count,
        totalXP: data.totalXP,
      }));

      return stats;
    }

    const stats: BountyStats[] = bountyData.map(data => ({
      userId: data.user_id,
      username: `<@${data.user_id}>`,
      // eslint-disable-next-line no-underscore-dangle
      totalBounties: data._count.id,
      // eslint-disable-next-line no-underscore-dangle
      totalXP: data._sum.amount || 0,
    }));

    return stats.filter(stat => stat.totalBounties > 0);
  } catch (error) {
    return [];
  }
}

export default getBountyStats;
