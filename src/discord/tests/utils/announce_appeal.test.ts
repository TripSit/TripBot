/* eslint-disable no-restricted-syntax */
import { DMChannel, TextChannel } from 'discord.js';
import { appealAccept, appealReject, appealReminder } from '../../utils/appeal';
import { dbMock } from '../../../vitest/utils/mockDb';
import { stubInstance } from '../../../vitest/utils/discordStubs';

const originalNodeEnv = process.env.NODE_ENV;
const originalGlobalEnv = (global as unknown as { env: unknown }).env;

describe('announcements', () => {
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    (global as unknown as { env: unknown }).env = originalGlobalEnv;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function load() {
    // Production uses the smaller frequencies (every 100 / 500 messages) which keeps these tests quick
    process.env.NODE_ENV = 'production';
    vi.resetModules();
    // env.config publishes itself as the global `env`, so load it first for the module under test to see production values
    const { env: freshEnv } = await import('../../../global/utils/env.config');
    const mod = await import('../../utils/announcements');
    return { announcements: mod.announcements, freshEnv };
  }

  function channelFor(freshEnv: Record<string, string>, over: Record<string, unknown> = {}) {
    const collectorHandlers: Record<string, (...args: unknown[]) => Promise<void>> = {};
    const sent = {
      react: vi.fn(),
      createReactionCollector: vi.fn(() => ({ on: vi.fn((event: string, fn: (...args: unknown[]) => Promise<void>) => { collectorHandlers[event] = fn; }) })),
    };
    const props = {
      id: 'chan', parentId: freshEnv.CATEGORY_CAMPGROUND, send: vi.fn(async () => sent), sendTyping: vi.fn(), ...over,
    };
    return {
      channel: stubInstance<TextChannel>(TextChannel, props), props, sent, collectorHandlers,
    };
  }

  const run = async (announcements: (m: never) => Promise<void>, channel: unknown, times: number) => {
    for (let i = 0; i < times; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await announcements({ channel } as never);
    }
  };

  it('posts a random tip every 100 messages in general chat', async () => {
    const { announcements, freshEnv } = await load();
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    const { channel, props } = channelFor(freshEnv as never);
    await run(announcements, channel, 99);
    expect(props.sendTyping).not.toHaveBeenCalled();
    await run(announcements, channel, 1);
    expect(props.sendTyping).toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(3000);
    const [{ embeds }] = props.send.mock.calls[0] as unknown as [{ embeds: Array<{ data: { description: string } }> }];
    expect(embeds[0].data.description.length).toBeGreaterThan(10);
  });

  it('sends the big rotating reminders every 500 messages and tracks points from reactions', async () => {
    const { announcements, freshEnv } = await load();
    const {
      channel, props, sent, collectorHandlers,
    } = channelFor(freshEnv as never);
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    await run(announcements, channel, 500);
    await vi.advanceTimersByTimeAsync(0);
    const bigSends = (props.send.mock.calls as unknown as Array<[{ embeds: Array<{ data: { footer?: unknown } }> }]>).filter(call => call[0].embeds[0].data.footer);
    expect(bigSends.length).toBe(1);
    expect(sent.react).toHaveBeenCalledWith('🕴');

    await collectorHandlers.collect({ emoji: { name: '🕴' } }, { id: 'reactor' });
    expect(dbMock.users.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { discord_id: 'reactor' }, create: { discord_id: 'reactor', move_points: 1 },
    }));
    await collectorHandlers.remove({ emoji: { name: '🕴' } }, { id: 'reactor' });
    expect(dbMock.users.upsert).toHaveBeenLastCalledWith(expect.objectContaining({ update: { move_points: { increment: -1 } } }));
  });

  it('only counts the reaction that matches the reminder', async () => {
    const { announcements, freshEnv } = await load();
    const { channel, sent } = channelFor(freshEnv as never);
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    await run(announcements, channel, 500);
    await vi.advanceTimersByTimeAsync(0);
    const { filter } = (sent.createReactionCollector.mock.calls as unknown as Array<[{ filter: (r: { emoji: { name: string } }) => boolean }]>)[0][0];
    expect(filter({ emoji: { name: '🕴' } })).toBe(true);
    expect(filter({ emoji: { name: '💧' } })).toBe(false);
  });

  it('sometimes posts a fun fact instead of a canned tip', async () => {
    const { announcements, freshEnv } = await load();
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    vi.spyOn(Math, 'random').mockReturnValue(0.9999999);
    const { channel, props } = channelFor(freshEnv as never);
    await run(announcements, channel, 100);
    await vi.advanceTimersByTimeAsync(3000);
    expect(props.send).toHaveBeenCalledTimes(1);
  });

  it('rotates through all three reminder types', async () => {
    const { announcements, freshEnv } = await load();
    const { channel, sent } = channelFor(freshEnv as never);
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    await run(announcements, channel, 1500);
    await vi.advanceTimersByTimeAsync(0);
    expect(sent.react.mock.calls.map(c => c[0])).toEqual(['🕴', '💧', '❤']);
  });

  it('ignores the sanctuary, clear lounge, other categories and DMs', async () => {
    const { announcements, freshEnv } = await load();
    const env2 = freshEnv as unknown as Record<string, string>;
    const sanctuary = channelFor(env2, { id: env2.CHANNEL_SANCTUARY });
    const clear = channelFor(env2, { id: env2.CHANNEL_CLEARLOUNGE });
    const elsewhere = channelFor(env2, { parentId: 'other' });
    const noParent = channelFor(env2, { parentId: null });
    for (const c of [sanctuary, clear, elsewhere, noParent]) {
      // eslint-disable-next-line no-await-in-loop
      await run(announcements, c.channel, 100);
      expect(c.props.sendTyping).not.toHaveBeenCalled();
    }
    const dm = stubInstance<DMChannel>(DMChannel, { id: 'dm', send: vi.fn() });
    await announcements({ channel: dm } as never);
  });
});

describe('appeals', () => {
  const user = { id: 'uid', mod_thread_id: 'thread' };
  const interaction = (over: Record<string, unknown> = {}) => ({
    guild: { id: 'g1', bans: { remove: vi.fn() } }, customId: 'appeal~accept~user123', ...over,
  }) as never;
  const modal = (text = '<b>"hi" & \'bye\'</b>') => ({ fields: { getTextInputValue: vi.fn(() => text) } }) as never;
  const latest = (status: string) => dbMock.appeals.findFirst.mockResolvedValue({ id: 'a1', status } as never);

  beforeEach(() => { dbMock.users.upsert.mockResolvedValue(user as never); });

  describe.each([
    ['appealAccept', appealAccept, 'ACCEPTED'],
    ['appealReject', appealReject, 'DENIED'],
  ] as const)('%s', (_name, fn, status) => {
    it('requires a guild and a modal', async () => {
      expect(await fn(interaction({ guild: null }), modal())).toEqual({ content: 'This command can only be used in a guild.' });
      expect(await fn(interaction())).toEqual({ content: 'Modal interaction required.' });
    });

    it('reports when there is no appeal', async () => {
      dbMock.appeals.findFirst.mockResolvedValue(null);
      expect(await fn(interaction(), modal())).toEqual({ content: 'No appeal found for this user.' });
    });

    it('records the decision with a sanitised moderator message', async () => {
      latest('RECEIVED');
      await fn(interaction(), modal());
      expect(dbMock.appeals.update).toHaveBeenCalledWith({
        where: { id: 'a1' },
        data: expect.objectContaining({ status, response_message: 'b&quot;hi&quot; &amp; &#x27;bye&#x27;/b' }),
      });
    });
  });

  it('unbans on acceptance, tolerating unban failures', async () => {
    latest('RECEIVED');
    const i = interaction();
    expect(await appealAccept(i, modal())).toEqual({ content: '<@user123> has been unbanned and their appeal approved.' });
    expect((i as { guild: { bans: { remove: ReturnType<typeof vi.fn> } } }).guild.bans.remove).toHaveBeenCalledWith('user123', expect.any(String));
    const failing = interaction();
    (failing as { guild: { bans: { remove: ReturnType<typeof vi.fn> } } }).guild.bans.remove.mockRejectedValue(new Error('Unknown Ban'));
    expect((await appealAccept(failing, modal())).content).toContain('has been unbanned');
  });

  it('confirms rejections', async () => {
    latest('RECEIVED');
    expect(await appealReject(interaction(), modal())).toEqual({ content: "<@user123>'s appeal has been rejected." });
  });

  it('enforces valid status transitions', async () => {
    latest('ACCEPTED');
    expect((await appealAccept(interaction(), modal())).content).toBe('This appeal has already been accepted.');
    expect((await appealReject(interaction(), modal())).content).toContain('cannot be changed');
    latest('DENIED');
    expect((await appealReject(interaction(), modal())).content).toContain('already been denied');
    expect((await appealAccept(interaction(), modal())).content).toContain('has been unbanned');
    expect(dbMock.appeals.update).toHaveBeenCalledTimes(1);
  });

  describe('appealReminder', () => {
    const appeal = {
      id: 'a1', user_id: 'uid', created_at: new Date('2024-01-01'), status: 'RECEIVED',
    } as never;
    const withThread = (thread: unknown) => {
      (global as unknown as { discordClient: unknown }).discordClient = { channels: { fetch: vi.fn(async () => thread) } };
    };

    it('pings the mod thread', async () => {
      dbMock.users.findFirst.mockResolvedValue({ ...user, discord_id: 'd1' } as never);
      const send = vi.fn();
      withThread({ isThread: () => true, send });
      expect(await appealReminder(appeal)).toEqual({ success: true, message: 'Your reminder has been sent!' });
      expect(send).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('<@d1> reminded us') }));
    });

    it('explains each failure', async () => {
      dbMock.users.findFirst.mockResolvedValue(null);
      expect((await appealReminder(appeal)).message).toContain('User not found');
      dbMock.users.findFirst.mockResolvedValue({ id: 'uid', mod_thread_id: null } as never);
      expect((await appealReminder(appeal)).message).toBe('No mod thread found for this user');
      dbMock.users.findFirst.mockResolvedValue(user as never);
      withThread({ isThread: () => false });
      expect((await appealReminder(appeal)).message).toBe('Mod thread not found or invalid');
      withThread(null);
      expect((await appealReminder(appeal)).message).toBe('Mod thread not found or invalid');
      (global as unknown as { discordClient: unknown }).discordClient = { channels: { fetch: vi.fn().mockRejectedValue(new Error('boom')) } };
      expect((await appealReminder(appeal)).message).toContain('Your reminder was not sent');
    });
  });
});
