/* eslint-disable max-len, sonarjs/no-duplicate-string, no-restricted-syntax, no-await-in-loop */
import { TextChannel } from 'discord.js';
import { dReminder } from '../../commands/guild/d.reminder';
import { dH2flow } from '../../commands/guild/d.h2flow';
import { dTripsitStats } from '../../commands/guild/d.tripsitstats';
import { dBusyness } from '../../commands/guild/d.busyness';
import { dLeaderboard } from '../../commands/guild/d.bountyleaderboard';
import { dRss } from '../../commands/guild/d.rss';
import { lastReply, slashStub } from '../../../vitest/utils/commandStubs';
import { collectionOf, flushPromises, stubInstance } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({
  user: vi.fn(), stats: vi.fn(), bounty: vi.fn(), rssCreate: vi.fn(), rssList: vi.fn(), rssDelete: vi.fn(), parseURL: vi.fn(),
}));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/utils/dbRecords', () => ({ getOrCreateUser: mocks.user }));
vi.mock('../../../global/commands/g.tripsitstats', () => ({ default: mocks.stats }));
vi.mock('../../../global/commands/g.bountyleaderboard', () => ({ getBountyStats: mocks.bounty }));
vi.mock('../../../global/commands/g.rss', () => ({ rssCreate: mocks.rssCreate, rssList: mocks.rssList, rssDelete: mocks.rssDelete }));
vi.mock('rss-parser', () => ({ default: class { parseURL = mocks.parseURL; } }));

const e = env as unknown as Record<string, string>;
const embedOf = (s: { editReply: { mock: { calls: unknown[][] } } }) => (lastReply(s).embeds as Array<{ data: Record<string, any> }>)[0].data; // eslint-disable-line @typescript-eslint/no-explicit-any

describe('reminder', () => {
  const channel = (id: string) => stubInstance<TextChannel>(TextChannel, { id, name: 'chan', send: vi.fn() });
  const guild = (botlog: unknown) => ({ id: 'g', channels: { fetch: vi.fn(async () => botlog) } });

  it('guards guild, channel type and channel list', async () => {
    expect(await dReminder.execute(slashStub({ guild: null }) as never)).toBe(false);
    expect(await dReminder.execute(slashStub({ channel: { id: 'x' } }) as never)).toBe(false);
    const stub = slashStub({ channel: channel('not-a-reminder-channel') });
    expect(await dReminder.execute(stub as never)).toBe(false);
    expect(lastReply(stub).content).toContain('channel with a reminder');
  });

  it('posts the reminder and logs it', async () => {
    const chan = channel(String(e.CHANNEL_SANCTUARY));
    const botlog = { send: vi.fn() };
    const stub = slashStub({ channel: chan, guild: guild(botlog) });
    expect(await dReminder.execute(stub as never)).toBe(true);
    expect(chan.send).toHaveBeenCalledTimes(1);
    expect(botlog.send).toHaveBeenCalled();
    const quiet = slashStub({ channel: chan, guild: guild(null) });
    expect(await dReminder.execute(quiet as never)).toBe(true);
  });
});

describe('h2flow', () => {
  it.each([
    [0, 'Non-member =('], [1, 'Copper Club'], [5, 'Bronze Club'], [10, 'Iron Club'], [25, 'Steel Club'], [50, 'Aluminum Club'], [100, 'Tin Club'],
    [200, 'Copper Club'], [300, 'Bronze Club'], [400, 'Silver Club'], [500, 'Gold Club'], [600, 'Platinum Club'], [700, 'Emerald Club'],
    [800, 'Sapphire Club'], [900, 'Ruby Club'], [1000, 'Diamond Club'],
  ])('%i points -> %s', async (points, club) => {
    mocks.user.mockResolvedValueOnce({ sparkle_points: points, move_points: 0, empathy_points: 0 });
    const stub = slashStub({ options: { ephemeral: true } });
    expect(await dH2flow.execute(stub as never)).toBe(false);
    expect(embedOf(stub).footer.text).toContain(club);
  });
});

describe('tripsitstats', () => {
  it('command and session subcommands', async () => {
    mocks.stats.mockResolvedValue('stats text');
    const cmd = slashStub({ subcommand: 'command', options: { target_command: 'drug', days: 7 } });
    expect(await dTripsitStats.execute(cmd as never)).toBe(true);
    expect(mocks.stats).toHaveBeenLastCalledWith('command', 'drug', 7);
    expect(embedOf(cmd).title).toBe('TripSit Command Stats');
    const defaultDays = slashStub({ subcommand: 'command', options: { target_command: 'drug' } });
    await dTripsitStats.execute(defaultDays as never);
    expect(mocks.stats).toHaveBeenLastCalledWith('command', 'drug', 0);
    const session = slashStub({ subcommand: 'session', options: { ephemeral: true } });
    await dTripsitStats.execute(session as never);
    expect(mocks.stats).toHaveBeenLastCalledWith('session');
  });
});

describe('busyness', () => {
  const message = (bot = false, id = 'a') => ({ createdTimestamp: Date.now(), author: { bot, id } });
  const channelWith = (msgs: unknown[]) => ({
    messages: { cache: collectionOf(msgs.map((m, i) => [`m${i}`, m] as [string, unknown])), fetch: vi.fn() },
  });

  it('requires administrator permission', async () => {
    const stub = slashStub({ extra: { memberPermissions: { has: () => false } } });
    expect(await dBusyness.execute(stub as never)).toBe(false);
    expect(stub.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('permission') }));
  });

  it('adjusts configuration values', async () => {
    const stub = slashStub({ subcommand: 'set', options: { key: 'messageWeight', value: 4 }, extra: { memberPermissions: { has: () => true } } });
    expect(await dBusyness.execute(stub as never)).toBe(true);
    expect(stub.reply).toHaveBeenCalledWith(expect.objectContaining({ content: 'Updated `messageWeight` to `4`.' }));
  });

  it('posts a live score, reschedules, and stops when the embed is deleted', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    try {
      const lounge = channelWith([message(false, 'a'), message(false, 'b'), message(true, 'bot')]);
      const msg = { client: { channels: { fetch: vi.fn(async () => lounge) } }, edit: vi.fn() };
      const stub = slashStub({ subcommand: 'post', options: { ephemeral: true }, extra: { memberPermissions: { has: () => true } } });
      stub.editReply.mockResolvedValue(msg);
      expect(await dBusyness.execute(stub as never)).toBe(true);
      await flushPromises();
      expect(msg.edit).toHaveBeenCalledTimes(1);
      const { fields } = (msg.edit.mock.calls[0][0] as { embeds: Array<{ data: { fields: Array<{ name: string }> } }> }).embeds[0].data;
      expect(fields[0].name).toContain('Current Busyness Score');
      // next tick: the embed vanished so the loop ends
      msg.edit.mockRejectedValueOnce(new Error('deleted'));
      await vi.advanceTimersByTimeAsync(30000);
      await flushPromises();
      expect(msg.edit).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(60000);
      expect(msg.edit).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('skips quiet periods and preloads an empty cache', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    try {
      const lounge = channelWith([]);
      const msg = { client: { channels: { fetch: vi.fn(async () => lounge) } }, edit: vi.fn() };
      vi.resetModules();
      const { dBusyness: fresh } = await import('../../commands/guild/d.busyness');
      const stub = slashStub({ subcommand: 'post', extra: { memberPermissions: { has: () => true } } });
      stub.editReply.mockResolvedValue(msg);
      await fresh.execute(stub as never);
      await flushPromises();
      expect(lounge.messages.fetch).toHaveBeenCalled();
      expect(msg.edit).not.toHaveBeenCalled();
      // the channel is cached, so a later tick no longer fetches it
      await vi.advanceTimersByTimeAsync(30000);
      expect(msg.client.channels.fetch).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('bounty leaderboard', () => {
  const rows = [
    { username: 'a', totalXP: 10, totalBounties: 30 },
    { username: 'b', totalXP: 500, totalBounties: 1 },
    ...Array.from({ length: 10 }, (_, i) => ({ username: `u${i}`, totalXP: i, totalBounties: i })),
  ];
  const setup = () => {
    const collector = { handlers: {} as Record<string, (arg?: unknown) => Promise<void>>, on(ev: string, fn: (arg?: unknown) => Promise<void>) { this.handlers[ev] = fn; } };
    const stub = slashStub({ options: {}, guild: { iconURL: () => null } });
    stub.editReply.mockResolvedValue({ createMessageComponentCollector: () => collector });
    return { stub, collector };
  };

  it('ranks by bounties by default and by xp on request', async () => {
    mocks.bounty.mockResolvedValue(rows.map(r => ({ ...r })));
    const { stub } = setup();
    expect(await dLeaderboard.execute(stub as never)).toBe(true);
    expect(embedOf(stub).description).toContain('Bounties Claimed');
    expect(embedOf(stub).fields[0].value).toContain('🥇 **a**');
    const xp = setup();
    xp.stub.options.get.mockReturnValue({ name: 'type', value: 'xp' });
    await dLeaderboard.execute(xp.stub as never);
    expect(embedOf(xp.stub).fields[0].value).toContain('🥇 **b**');
    expect(embedOf(xp.stub).fields[0].value).toContain('🥉');
  });

  it('shows a placeholder with no data', async () => {
    mocks.bounty.mockResolvedValue([]);
    const { stub } = setup();
    await dLeaderboard.execute(stub as never);
    expect(embedOf(stub).fields[0].name).toContain('No Data');
  });

  it('only lets the invoker switch the type, and removes the menu at the end', async () => {
    mocks.bounty.mockResolvedValue(rows.map(r => ({ ...r })));
    const { stub, collector } = setup();
    await dLeaderboard.execute(stub as never);
    const stranger = {
      user: { id: 'other' }, reply: vi.fn(), update: vi.fn(), values: ['xp'],
    };
    await collector.handlers.collect(stranger);
    expect(stranger.reply).toHaveBeenCalled();
    const owner = {
      user: { id: 'u1' }, reply: vi.fn(), update: vi.fn(), values: ['xp'],
    };
    await collector.handlers.collect(owner);
    expect(owner.update).toHaveBeenCalled();
    await collector.handlers.end();
    expect(stub.editReply).toHaveBeenLastCalledWith({ components: [] });
    stub.editReply.mockRejectedValueOnce(new Error('gone'));
    await expect(collector.handlers.end()).resolves.toBeUndefined();
  });

  it('reports errors', async () => {
    mocks.bounty.mockRejectedValue(new Error('db'));
    const deferred = slashStub();
    (deferred as { deferred: boolean }).deferred = true;
    expect(await dLeaderboard.execute(deferred as never)).toBe(false);
    expect(lastReply(deferred).content).toContain('error occurred');
    const early = slashStub();
    early.deferReply.mockRejectedValueOnce(new Error('x'));
    expect(await dLeaderboard.execute(early as never)).toBe(false);
    expect(early.reply).toHaveBeenCalled();
  });
});

describe('rss', () => {
  const text = (id = 'c1') => stubInstance<TextChannel>(TextChannel, { id, name: 'news', guild: { id: 'g' } });
  const guild = { id: 'g', name: 'Guild' };

  it('needs a guild', async () => {
    expect(await dRss.execute(slashStub({ guild: null, subcommand: 'list' }) as never)).toBe(false);
  });

  it('add validates the url, feed and channel', async () => {
    const bad = slashStub({ guild, subcommand: 'add', options: { url: 'https://x/feed' } });
    expect(await dRss.execute(bad as never)).toBe(false);
    expect(lastReply(bad).content).toContain('.rss');
    mocks.parseURL.mockRejectedValueOnce(new Error('bad'));
    const notFeed = slashStub({ guild, subcommand: 'add', options: { url: 'https://x/a.rss' } });
    expect(await dRss.execute(notFeed as never)).toBe(false);
    expect(lastReply(notFeed).content).toContain('not a valid RSS');
    mocks.parseURL.mockResolvedValueOnce({});
    const noChan = slashStub({ guild, subcommand: 'add', options: { url: 'https://x/a.rss', add_to_channel: { id: 'v' } } });
    expect(await dRss.execute(noChan as never)).toBe(false);
  });

  it('add, list and remove', async () => {
    mocks.parseURL.mockResolvedValueOnce({});
    const add = slashStub({ guild, subcommand: 'add', options: { url: 'https://x/a.rss', add_to_channel: text() } });
    expect(await dRss.execute(add as never)).toBe(true);
    expect(mocks.rssCreate).toHaveBeenCalledWith('c1', 'g', 'https://x/a.rss');

    mocks.rssList.mockResolvedValueOnce([{ url: 'https://x/a.rss', destination: 'c1' }]);
    const list = slashStub({ guild, subcommand: 'list' });
    await dRss.execute(list as never);
    expect(embedOf(list).description).toContain('<#c1>');
    mocks.rssList.mockResolvedValueOnce([]);
    const empty = slashStub({ guild, subcommand: 'list' });
    await dRss.execute(empty as never);
    expect(embedOf(empty).title).toContain('no RSS feeds');

    const remove = slashStub({ guild, subcommand: 'remove', options: { remove_from_channel: text() } });
    expect(await dRss.execute(remove as never)).toBe(true);
    expect(mocks.rssDelete).toHaveBeenCalledWith('c1', 'g');
    const badRemove = slashStub({ guild, subcommand: 'remove', options: { remove_from_channel: { id: 'v' } } });
    expect(await dRss.execute(badRemove as never)).toBe(false);
  });
});
