import { stripIndents } from 'common-tags';

const F = f(__filename);

async function getCommandStats(command?: null | string, days?: number): Promise<string> {
  log.info(F, 'Getting command stats');

  let whereClause: any = {};

  const filters = [];

  if (days) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    filters.push({
      created_at: {
        gte: since,
      },
    });
  }

  if (command) {
    filters.push({
      command: {
        contains: command,
        mode: 'insensitive',
      },
    });
  }

  if (filters.length > 0) {
    whereClause = {
      AND: filters,
    };
  }

  const stats = await db.command_usage.groupBy({
    _count: {
      command: true,
    },
    by: ['command'],
    orderBy: {
      _count: {
        command: 'desc',
      },
    },
    where: whereClause,
  });

  if (stats.length === 0) {
    let message = 'No command usage found';
    if (command) {
      message += ` for \`${command}\``;
    }
    if (days) {
      message += ` in the last ${days} days`;
    }
    message += '.';
    return message;
  }

  const topStats = command ? stats : stats.slice(0, 25);

  const formatted = topStats
    .map((s) => `- \`${s.command}\`: ${s._count.command} use(s)`)
    .join('\n');

  const titleParts = ['📊 **Command Stats'];

  if (command) {
    titleParts.push(`for \`${command}\``);
  }
  if (days) {
    titleParts.push(`(Last ${days} Days)`);
  }

  const title = `${titleParts.join(' ')}**`;

  return `${title}\n${formatted}`;
}

async function getHelperStats(): Promise<string> {
  /* Skeleton
  This command should pull how many tickets a helper has interacted in and owned in total or within X time frame

  Requires: add a column to user_tickets and assign the user who "owns" tickets ID.
   */
  log.info(F, 'getHelperStats');
  return 'Not implemented';
}

async function getSessionStats(): Promise<string> {
  const now = new Date();

  // Calculate date ranges
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
  const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);

  // Fetch data for this month and last month
  const thisMonthsTickets = await db.user_tickets.findMany({
    where: {
      created_at: {
        gte: startOfThisMonth,
      },
    },
  });

  const lastMonthsTickets = await db.user_tickets.findMany({
    where: {
      created_at: {
        gte: startOfLastMonth,
        lt: startOfThisMonth,
      },
    },
  });

  // Fetch data for this year and last year
  const thisYearsTickets = await db.user_tickets.findMany({
    where: {
      created_at: {
        gte: startOfYear,
      },
    },
  });

  const lastYearsTickets = await db.user_tickets.findMany({
    where: {
      created_at: {
        gte: startOfLastYear,
        lt: endOfLastYear,
      },
    },
  });

  // Calculate differences
  const monthDifference = thisMonthsTickets.length - lastMonthsTickets.length;
  const yearDifference = thisYearsTickets.length - lastYearsTickets.length;

  // Format the results
  return stripIndents`
    📊 Ticket Statistics:
    - Tickets this month: ${thisMonthsTickets.length}
    - Tickets last month: ${lastMonthsTickets.length} (${monthDifference >= 0 ? '+' : ''}${monthDifference})
    
    - Tickets this year: ${thisYearsTickets.length}
    - Tickets last year: ${lastYearsTickets.length} (${yearDifference >= 0 ? '+' : ''}${yearDifference})
  `;
}

/**
 * Fetch statistics data for a given feature from the database.
 * @param feature - The feature for which statistics are requested.
 * @returns The data related to the specified feature.
 */
async function getTripSitStatistics(
  feature: string,
  command?: null | string,
  days?: number,
): Promise<string> {
  try {
    switch (feature) {
      case 'command': {
        return await getCommandStats(command, days);
      }

      case 'helpers': {
        return await getHelperStats();
      }

      case 'session': {
        return await getSessionStats();
      }

      default: {
        throw new Error(`Feature not recognized: ${feature}`);
      }
    }
  } catch (error) {
    log.error(F, `Error fetching statistics for feature: ${feature}.  \n\nError: ${error}`);
  }
  return 'No stats found.';
}

export default getTripSitStatistics;
