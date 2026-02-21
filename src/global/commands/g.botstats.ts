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
    cpuUsage, 
    memStats, 
    netStats, 
    driveStats,
    dbTripbotCheck,
    dbMoodleCheck
  ] = await Promise.all([
    cpu.usage().catch(() => 0),
    mem.used().catch(() => ({ usedMemMb: 0, totalMemMb: 0 })),
    netstat.inOut().catch(() => null),
    drive.info('/').catch(() => ({ usedPercentage: '0', totalGb: '0' })),
    // Database 'Is it plugged in?' checks
    db.$queryRaw`SELECT 1`.then(() => 'Online' as const).catch(() => 'Offline' as const),
    db.$queryRaw`SELECT 1`.then(() => 'Online' as const).catch(() => 'Offline' as const),
  ]);

  // 2. Gather Discord Data
  const guilds = discordClient.guilds.cache;
  const userCount = guilds.reduce((acc, guild) => acc + (guild.memberCount || 0), 0);
  
  // 3. Node.js Process Internals
  const nodeMem = process.memoryUsage();
  // Active handles help track resource/connection leaks
  const activeHandles = (process as any)._getActiveHandles ? (process as any)._getActiveHandles().length : 0;

  // 4. Network Parsing (Defensive logic for Docker environments)
  const net = netStats as NetStatMetrics;
  const netDown = net?.total?.inputMb ?? 0;
  const netUp = net?.total?.outputMb ?? 0;

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
    cpuUsage: Math.round(Number(cpuUsage)),
    cpuCount: cpu.count(),
    memUsage: memStats.totalMemMb > 0 
      ? Math.round((memStats.usedMemMb / memStats.totalMemMb) * 100) 
      : 0,
    memTotal: Math.round(memStats.totalMemMb),
    netDown,
    netUp,
    hostUptime: os.uptime(),
    driveUsage: parseInt(driveStats.usedPercentage.toString(), 10) || 0,
    driveTotal: parseInt(driveStats.totalGb.toString(), 10) || 0,
  };
}

export default botStats;