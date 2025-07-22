interface BountyStats {
  totalBounties: number;
  totalXP: number;
  userId: string;
  username: string;
}

export async function getBountyStats(): Promise<BountyStats[]> {
  try {
    const rawData = await db.claimed_bounties.findMany({
      select: {
        amount: true,
        user_id: true,
      },
    });

    if (rawData.length === 0) {
      return [];
    }

    // Try the groupBy approach first
    const bountyData = await db.claimed_bounties.groupBy({
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
      by: ['user_id'],
    });

    if (bountyData.length === 0) {
      // Manual aggregation fallback
      const userStats = new Map<string, { count: number; totalXP: number }>();

      for (const record of rawData) {
        const existing = userStats.get(record.user_id) || { count: 0, totalXP: 0 };
        userStats.set(record.user_id, {
          count: existing.count + 1,
          totalXP: existing.totalXP + (record.amount || 0),
        });
      }

      const stats: BountyStats[] = [...userStats.entries()].map(([userId, data]) => ({
        totalBounties: data.count,
        totalXP: data.totalXP,
        userId,
        username: `<@${userId}>`,
      }));

      return stats;
    }

    const stats: BountyStats[] = bountyData.map((data) => ({
      totalBounties: data._count.id,
      totalXP: data._sum.amount || 0,

      userId: data.user_id,

      username: `<@${data.user_id}>`,
    }));

    return stats.filter((stat) => stat.totalBounties > 0);
  } catch {
    return [];
  }
}

export default getBountyStats;
