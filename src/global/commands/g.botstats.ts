import { OSUtils } from 'node-os-utils';
import os from 'node:os'; // Added for os.uptime()
import drugDataCombined from '../../../assets/data/combinedDB.json';
import drugDataTripsit from '../../../assets/data/tripsitDB.json';

const osutils = new OSUtils();

// Define the comprehensive stats type
export type BotStats = {
  // Application Stats
  tsDbSize: number;
  tsPwDbSize: number;
  guildCount: number;
  userCount: number;
  channelCount: number;
  commandCount: number;
  uptime: number;
  ping: number;

  // Database Health
  dbTripbotStatus: 'Online' | 'Offline';
  dbMoodleStatus: 'Online' | 'Offline';

  // Node.js Internals
  nodeHeapUsed: number;
  nodeHeapTotal: number;
  activeHandles: number;

  // OS & Hardware Stats
  cpuUsage: number;
  cpuCount: number;
  memUsage: number;
  memTotal: number;
  netDown: number;
  netUp: number;
  hostUptime: number;
  driveUsage: number;
  driveTotal: number;
};

export async function botStats(): Promise<BotStats> {
  // 1. Fire off all async checks in parallel for maximum speed
  const [
    cpuUsageRes,
    cpuInfoRes,
    memInfoRes,
    diskInfoRes,
    netOverviewRes,
    dbTripbotCheck,
    dbMoodleCheck,
  ] = await Promise.all([
    osutils.cpu.usage().catch(() => ({ success: false as const })),
    osutils.cpu.info().catch(() => ({ success: false as const })),
    osutils.memory.info().catch(() => ({ success: false as const })),
    osutils.disk.info().catch(() => ({ success: false as const })),
    osutils.network.overview().catch(() => ({ success: false as const })),
    db.$queryRaw`SELECT 1`.then(() => 'Online' as const).catch(() => 'Offline' as const),
    db.$queryRaw`SELECT 1`.then(() => 'Online' as const).catch(() => 'Offline' as const),
  ]);

  // 2. Gather Discord Data
  const guilds = discordClient.guilds.cache;
  const userCount = guilds.reduce((acc, guild) => acc + (guild.memberCount || 0), 0);

  // 3. Node.js Process Internals
  const nodeMem = process.memoryUsage();
  // Active handles help track resource/connection leaks
  const activeHandles = typeof process.getActiveResourcesInfo === 'function'
    ? process.getActiveResourcesInfo().length
    : 0;

  // 4. Safely unwrap v2 MonitorResults
  const cpuUsage = cpuUsageRes.success ? cpuUsageRes.data : 0;
  const cpuCount = cpuInfoRes.success ? cpuInfoRes.data.cores : 0;

  const memTotal = memInfoRes.success ? memInfoRes.data.total.toMB() : 0;
  const memUsage = memInfoRes.success ? memInfoRes.data.usagePercentage : 0;

  // Find the root/main drive, fallback to the first available disk if exact match isn't found
  const rootDisk = diskInfoRes.success
    ? diskInfoRes.data.find(d => d.mountpoint === '/' || d.mountpoint === 'C:\\') || diskInfoRes.data[0]
    : null;
  const driveTotal = rootDisk ? rootDisk.total.toGB() : 0;
  const driveUsage = rootDisk ? rootDisk.usagePercentage : 0;

  const netDown = netOverviewRes.success ? netOverviewRes.data.totalRxBytes.toMB() : 0;
  const netUp = netOverviewRes.success ? netOverviewRes.data.totalTxBytes.toMB() : 0;

  // 5. Construct and return the result
  return {
    // App Data
    tsDbSize: Object.keys(drugDataTripsit).length,
    tsPwDbSize: Object.keys(drugDataCombined).length,
    guildCount: guilds.size,
    userCount,
    channelCount: discordClient.channels.cache.size,
    commandCount: discordClient.commands.size,
    uptime: global.bootTime ? Date.now() - global.bootTime.getTime() : 0,
    ping: discordClient.ws.ping,

    // Health Checks
    dbTripbotStatus: dbTripbotCheck,
    dbMoodleStatus: dbMoodleCheck,

    // Node.js Internals
    nodeHeapUsed: Math.round(nodeMem.heapUsed / 1024 / 1024),
    nodeHeapTotal: Math.round(nodeMem.heapTotal / 1024 / 1024),
    activeHandles,

    // Hardware Stats
    cpuUsage: Math.round(cpuUsage),
    cpuCount,
    memUsage: Math.round(memUsage),
    memTotal: Math.round(memTotal),
    netDown: Math.round(netDown),
    netUp: Math.round(netUp),
    hostUptime: os.uptime(),
    driveUsage: Math.round(driveUsage),
    driveTotal: Math.round(driveTotal),
  };
}

export default botStats;
