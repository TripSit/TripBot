import { dbMock } from '../../../vitest/utils/mockDb';

const ok = (data: unknown) => Promise.resolve({ success: true, data });
const fail = () => Promise.reject(new Error('unsupported'));
const bytes = (n: number) => ({ toMB: () => n, toGB: () => n });

const osMock = vi.hoisted(() => ({ healthy: true }));
const moodleMock = vi.hoisted(() => ({ $queryRaw: vi.fn() }));

vi.mock('../../../prisma/moodle/client', () => ({ default: moodleMock }));

vi.mock('node-os-utils', () => ({
  OSUtils: class {
    cpu = {
      usage: () => (osMock.healthy ? ok(41.6) : fail()),
      info: () => (osMock.healthy ? ok({ cores: 8 }) : fail()),
    };

    memory = {
      info: () => (osMock.healthy ? ok({ total: bytes(16000), usagePercentage: 50.4 }) : fail()),
    };

    disk = {
      info: () => (osMock.healthy
        ? ok([{ mountpoint: '/mnt', total: bytes(1), usagePercentage: 1 },
          { mountpoint: '/', total: bytes(500), usagePercentage: 70.2 }])
        : fail()),
    };

    network = {
      overview: () => (osMock.healthy ? ok({ totalRxBytes: bytes(10), totalTxBytes: bytes(20) }) : fail()),
    };
  },
}));

describe('botStats', () => {
  beforeEach(() => {
    (global as unknown as { discordClient: unknown }).discordClient = {
      guilds: { cache: new Map([['a', { memberCount: 10 }], ['b', {}]]) },
      channels: { cache: { size: 3 } },
      commands: { size: 4 },
      ws: { ping: 25 },
    };
    // Map has .size but not .reduce; provide the Collection-style method the code uses.
    const cache = (global as unknown as { discordClient: { guilds: { cache: Map<string, { memberCount?: number }> } } })
      .discordClient.guilds.cache as unknown as { reduce: unknown };
    cache.reduce = function reduce(this: Map<string, { memberCount?: number }>, fn: (a: number, g: { memberCount?: number }) => number, init: number) {
      return [...this.values()].reduce(fn, init);
    };
    global.bootTime = new Date(Date.now() - 5000);
  });

  it('collects stats when every probe succeeds', async () => {
    osMock.healthy = true;
    (dbMock.$queryRaw as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    moodleMock.$queryRaw.mockResolvedValue([]);
    const { botStats } = await import('../../commands/g.botstats');
    const stats = await botStats();
    expect(stats).toMatchObject({
      guildCount: 2,
      userCount: 10,
      channelCount: 3,
      commandCount: 4,
      ping: 25,
      dbTripbotStatus: 'Online',
      dbMoodleStatus: 'Online',
      cpuUsage: 42,
      cpuCount: 8,
      memUsage: 50,
      memTotal: 16000,
      driveTotal: 500,
      driveUsage: 70,
      netDown: 10,
      netUp: 20,
    });
    expect(stats.uptime).toBeGreaterThanOrEqual(5000);
  });

  // Regression test for TripSit/TripBot#1347: both probes used the TripBot client, so Moodle always mirrored it.
  it('reports the TripBot and Moodle databases independently', async () => {
    osMock.healthy = true;
    const { botStats } = await import('../../commands/g.botstats');
    (dbMock.$queryRaw as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    moodleMock.$queryRaw.mockRejectedValue(new Error('mariadb down'));
    expect(await botStats()).toMatchObject({ dbTripbotStatus: 'Online', dbMoodleStatus: 'Offline' });
    (dbMock.$queryRaw as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('postgres down'));
    moodleMock.$queryRaw.mockResolvedValue([]);
    expect(await botStats()).toMatchObject({ dbTripbotStatus: 'Offline', dbMoodleStatus: 'Online' });
  });

  it('degrades to zeros and Offline when probes fail', async () => {
    osMock.healthy = false;
    (dbMock.$queryRaw as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('down'));
    moodleMock.$queryRaw.mockRejectedValue(new Error('down'));
    global.bootTime = undefined as unknown as Date;
    const { botStats } = await import('../../commands/g.botstats');
    const stats = await botStats();
    expect(stats).toMatchObject({
      dbTripbotStatus: 'Offline',
      dbMoodleStatus: 'Offline',
      cpuUsage: 0,
      cpuCount: 0,
      memTotal: 0,
      driveTotal: 0,
      netDown: 0,
      uptime: 0,
    });
  });
});
