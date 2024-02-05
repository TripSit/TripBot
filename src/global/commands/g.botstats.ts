/* eslint-disable */
import {
  cpu,
  drive,
  mem,
  netstat,
  os,
  NetStatMetrics,
} from 'node-os-utils';
import drugDataTripsit from '../../../assets/data/tripsitDB.json';
import drugDataCombined from '../../../assets/data/combinedDB.json';

export default botStats;

const F = f(__filename);

type BotStats = {
  tsDbSize: number;
  tsPwDbSize: number;
  guildCount: number;
  userCount: number;
  channelCount: number;
  commandCount: number;
  uptime: number;
  ping: number;
  cpuUsage: number;
  cpuCount: number;
  memUsage: number;
  memTotal: number;
  netDown: number;
  netUp: number;
  hostUptime: number;
  driveUsage: number;
  driveTotal: number;
  swapUsage: number;
  swapTotal: number;
};

export async function botStats():Promise<BotStats> {
  const response = {} as BotStats;
 
  // Get drug db stats
  response.tsDbSize = Object.keys(drugDataTripsit).length;
  response.tsPwDbSize = Object.keys(drugDataCombined).length;

  // Get discord stats

  await discordClient.guilds.fetch();
  response.guildCount = discordClient.guilds.cache.size;

  // Fetching member counts
  const memberCountPromises = discordClient.guilds.cache.map(async (guild) => {
    try {
      await guild.members.fetch();
      return guild.memberCount;
    } catch (e) {
      // log.error(F, `Error fetching members for guild: ${guild.name}`);
      return 0;
    }
  });

  // Sum up all the member counts
  const memberCounts = await Promise.all(memberCountPromises);
  response.userCount = memberCounts.reduce((acc, count) => acc + count, 0);

  response.channelCount = discordClient.channels.cache.size;
  response.commandCount = discordClient.commands.size;
  response.uptime = global.bootTime
    ? (new Date().getTime() - global.bootTime.getTime())
    : 0;

  // Get server stats
  response.ping = discordClient.ws.ping;

  response.cpuUsage = Math.round(await cpu.usage() * 100);
  response.cpuCount = cpu.count();

  const memStats = await mem.used();
  response.memUsage = Math.round((memStats.usedMemMb / memStats.totalMemMb) * 100);
  response.memTotal = Math.round(memStats.totalMemMb);

  const netStats = await netstat.inOut() as NetStatMetrics;
  response.netDown = netStats.total.inputMb;
  response.netUp = netStats.total.outputMb;

  response.hostUptime = os.uptime();

  const driveStats = await drive.info('/sda');
  // log.debug(F, `driveStats: ${JSON.stringify(driveStats, null, 2)}`);
  response.driveUsage = parseInt(driveStats.usedPercentage, 10);
  response.driveTotal = parseInt(driveStats.totalGb, 10);
  // log.debug(F, `driveUsage: ${response.driveUsage}`);
  // log.debug(F, `driveTotal: ${response.driveTotal}`);

  // const swapStats = await drive.info('/sdb');
  // // log.debug(F, `swapStats: ${JSON.stringify(swapStats, null, 2)}`);
  // response.swapUsage = parseInt(swapStats.usedPercentage, 10);
  // response.swapTotal = parseInt(swapStats.totalGb, 10);
  // // log.debug(F, `swapUsage: ${response.swapUsage}`);
  // // log.debug(F, `swapTotal: ${response.swapTotal}`);

  // log.debug(F, `response: ${JSON.stringify(response, null, 2)}`);
  return response;
}
