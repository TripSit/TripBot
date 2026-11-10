import { tripSitTrustScore } from '../../utils/trustScore';
import { collectionOf } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({ checkGuild: vi.fn() }));
vi.mock('../../utils/checkPermissions', () => ({ checkGuildPermissions: mocks.checkGuild }));

const NOW = new Date('2024-06-15T12:00:00Z').getTime();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

type Guild = { members: { cache: { get: (id: string) => unknown } }; bans: { cache: { get: (id: string) => unknown } } };

function guild(opts: { member?: boolean; ban?: object | Error } = {}): Guild {
  return {
    members: { cache: { get: () => (opts.member ? {} : undefined) } },
    bans: {
      cache: {
        get: () => {
          if (opts.ban instanceof Error) throw opts.ban;
          return opts.ban;
        },
      },
    },
  };
}

function setup(ageMs: number, opts: { avatar?: boolean; guilds?: Guild[] } = {}) {
  const guilds = opts.guilds ?? [guild()];
  (global as unknown as { discordClient: unknown }).discordClient = {
    users: {
      fetch: vi.fn(async () => ({
        id: 't', createdAt: new Date(NOW - ageMs), avatarURL: () => (opts.avatar ? 'https://a' : null),
      })),
    },
    guilds: { fetch: vi.fn(), cache: collectionOf(guilds.map((g, i) => [`g${i}`, g] as [string, Guild])) },
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  mocks.checkGuild.mockResolvedValue({ hasPermission: true });
});
afterEach(() => vi.useRealTimers());

describe('account age', () => {
  it.each([
    [2 * 365 * DAY, 6, 'at least a year ago'],
    [90 * DAY, 5, 'months ago'],
    [14 * DAY, 4, 'weeks ago'],
    [3 * DAY, 3, 'days ago'],
    [5 * HOUR, 2, 'hours ago'],
    [10 * MIN, 1, 'minutes ago'],
    [20_000, 0, 'seconds ago'],
  ])('scores %d ms old accounts at %d', async (age, score, phrase) => {
    setup(age);
    const result = await tripSitTrustScore('t');
    expect(result.trustScore).toBe(score);
    expect(result.tsReasoning).toContain(phrase);
  });
});

describe('other signals', () => {
  it('adds a point for avatars', async () => {
    setup(2 * 365 * DAY, { avatar: true });
    const result = await tripSitTrustScore('t');
    expect(result.trustScore).toBe(7);
    expect(result.tsReasoning).toContain('Account has a profile picture');
    setup(2 * 365 * DAY);
    expect((await tripSitTrustScore('t')).tsReasoning).toContain('does not have a profile picture');
  });

  it('adds a point per mutual guild', async () => {
    setup(2 * 365 * DAY, { guilds: [guild({ member: true }), guild({ member: true }), guild()] });
    const result = await tripSitTrustScore('t');
    expect(result.trustScore).toBe(8);
    expect(result.tsReasoning).toContain('share 2 guilds');
  });

  it('reports how many guilds it could check for bans', async () => {
    setup(2 * 365 * DAY, { guilds: [guild(), guild()] });
    mocks.checkGuild.mockResolvedValueOnce({ hasPermission: false }).mockResolvedValueOnce({ hasPermission: true });
    expect((await tripSitTrustScore('t')).tsReasoning).toContain('Not banned in 1 other guilds');
  });

  it('subtracts five per ban and lists reasons, fetching partial bans', async () => {
    const fetch = vi.fn();
    const partial = {
      partial: true, fetch, reason: null, guild: { name: 'GuildA' },
    };
    const full = { partial: false, reason: 'spam', guild: { name: 'GuildB' } };
    setup(2 * 365 * DAY, { guilds: [guild({ ban: partial }), guild({ ban: full }), guild()] });
    const result = await tripSitTrustScore('t');
    expect(result.trustScore).toBe(6 - 10);
    expect(fetch).toHaveBeenCalled();
    expect(result.tsReasoning).toContain('Banned in least 2 of the 3 guilds');
    expect(result.tsReasoning).toContain('GuildA: No reason found.');
    expect(result.tsReasoning).toContain('GuildB: spam');
  });

  it('treats ban lookup errors as not banned', async () => {
    const notFound = Object.assign(new Error('Unknown Ban'), { code: 10026 });
    setup(2 * 365 * DAY, { guilds: [guild({ ban: notFound }), guild({ ban: new Error('boom') })] });
    expect((await tripSitTrustScore('t')).trustScore).toBe(6);
  });
});
