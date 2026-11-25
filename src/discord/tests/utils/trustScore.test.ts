import { tripSitTrustScore } from '../../utils/trustScore';
import { collectionOf } from '../../../vitest/utils/discordStubs';

const NOW = new Date('2024-06-15T12:00:00Z').getTime();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

type Guild = {
  members: { cache: { get: (id: string) => unknown } };
  bans: { cache: { get: (id: string) => unknown } };
};

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

  it('ignores which other guilds the account is in', async () => {
    setup(2 * 365 * DAY, { guilds: [guild({ member: true }), guild({ member: true }), guild()] });
    const result = await tripSitTrustScore('t');
    expect(result.trustScore).toBe(6);
    expect(result.tsReasoning).not.toContain('guilds');
  });

  it('never looks at bans in other guilds', async () => {
    const ban = { partial: false, reason: 'spam', guild: { name: 'GuildB' } };
    setup(2 * 365 * DAY, { guilds: [guild({ ban })] });
    const result = await tripSitTrustScore('t');
    expect(result.trustScore).toBe(6);
    expect(result.tsReasoning).not.toContain('Banned');
    expect(result.tsReasoning).not.toContain('GuildB');
  });
});
