import { stripIndents } from 'common-tags';

const F = f(__filename);

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

async function getCommandStats(command?: string | null, days?: number): Promise<string> {
  log.info(F, 'Getting command stats');
  const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined;
  const stats = await db.command_usage.findMany({
    where: {
      ...(command ? { command: { contains: command, mode: 'insensitive' as const } } : {}),
      ...(since ? { last_used_at: { gte: since } } : {}),
    },
    orderBy: { usage_count: 'desc' },
  });

  if (!stats.length) {
    let message = 'No command usage found';
    if (command) {
      message += ` for \`${command}\``;
    }
    if (days) message += ` among commands last used in the past ${days} days`;
    message += '.';
    return message;
  }

  /* eslint-disable no-underscore-dangle */
  const topStats = command ? stats : stats.slice(0, 25);

  const formatted = topStats
    .map(s => `- \`${s.command}\`: ${s.usage_count} use(s), last used ${s.last_used_at.toISOString()}`)
    .join('\n');

  const titleParts = ['📊 **Command Stats'];

  if (command) titleParts.push(`for \`${command}\``);
  if (days) titleParts.push(`(Last used within ${days} days; totals are lifetime)`);

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

/**
 * Fetch statistics data for a given feature from the database.
 * @param feature - The feature for which statistics are requested.
 * @returns The data related to the specified feature.
 */
async function getTripSitStatistics(feature: string, command?: string | null, days?: number): Promise<string> {
  try {
    switch (feature) {
      case 'session':
        return await getSessionStats();

      case 'command':
        return await getCommandStats(command, days);

      case 'helpers':
        return await getHelperStats();

      default:
        throw new Error(`Feature not recognized: ${feature}`);
    }
  } catch (error) {
    log.error(F, `Error fetching statistics for feature: ${feature}.  \n\nError: ${error}`);
  }
  return 'No stats found.';
}

export default getTripSitStatistics;
