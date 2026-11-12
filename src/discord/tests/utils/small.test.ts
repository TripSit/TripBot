/* eslint-disable sonarjs/no-duplicate-string */
import { MessageFlags, TextChannel, DMChannel } from 'discord.js';
import type {
  Message, User, GuildMember, Client,
} from 'discord.js';
import { replyGuildOnly, GUILD_ONLY_TEXT } from '../../utils/guildOnly';
import { commandRun } from '../../utils/commandRun';
import commandCooldown from '../../utils/commandCooldown';
import { RateLimiter, formatTimeUntilReset } from '../../utils/commandRateLimiter';
import { embedTemplate, errorEmbed } from '../../utils/embedTemplate';
import { karma } from '../../utils/karma';
import { youAre, valMatch } from '../../utils/youAre';
import { stubInstance } from '../../../vitest/utils/discordStubs';

const e = env as unknown as Record<string, string>;

const mocks = vi.hoisted(() => ({ handleError: vi.fn() }));
vi.mock('../../events/error', () => ({ default: mocks.handleError }));

describe('replyGuildOnly', () => {
  const make = (state: object) => ({ reply: vi.fn(), editReply: vi.fn(), ...state }) as never;

  it('edits the reply when the interaction was already deferred or replied', async () => {
    const deferred = make({ deferred: true });
    await replyGuildOnly(deferred);
    expect((deferred as { editReply: ReturnType<typeof vi.fn> }).editReply).toHaveBeenCalledWith({ content: GUILD_ONLY_TEXT });
    const replied = make({ replied: true });
    await replyGuildOnly(replied);
    expect((replied as { editReply: ReturnType<typeof vi.fn> }).editReply).toHaveBeenCalled();
  });

  it('replies ephemerally on request and publicly otherwise', async () => {
    const eph = make({});
    await replyGuildOnly(eph, { ephemeral: true });
    expect((eph as { reply: ReturnType<typeof vi.fn> }).reply).toHaveBeenCalledWith({
      content: GUILD_ONLY_TEXT, flags: MessageFlags.Ephemeral,
    });
    const pub = make({});
    await replyGuildOnly(pub);
    expect((pub as { reply: ReturnType<typeof vi.fn> }).reply).toHaveBeenCalledWith({ content: GUILD_ONLY_TEXT });
  });
});

describe('commandRun', () => {
  const client = (command?: object) => ({ commands: { get: vi.fn(() => command) } }) as unknown as Client;
  const interaction = { commandName: 'ping' } as never;

  it('ignores unknown commands', async () => {
    await commandRun(interaction, client());
    expect(mocks.handleError).not.toHaveBeenCalled();
  });

  it('executes known commands and routes failures to the error handler', async () => {
    const execute = vi.fn();
    await commandRun(interaction, client({ execute }));
    expect(execute).toHaveBeenCalledWith(interaction);

    const error = new Error('boom');
    await commandRun(interaction, client({ execute: vi.fn().mockRejectedValue(error) }));
    expect(mocks.handleError).toHaveBeenCalledWith(error, 'ping', interaction);
  });
});

describe('commandCooldown', () => {
  afterEach(() => vi.useRealTimers());

  it('allows the first use then blocks until the cooldown passes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(1_000_000);
    const user = { id: 'cd-user' } as User;
    expect(await commandCooldown(user, 'cmd', 10_000)).toEqual({ success: true });
    vi.setSystemTime(1_004_000);
    expect(await commandCooldown(user, 'cmd', 10_000)).toEqual({
      success: false, message: 'Please wait 6.0 more seconds before using this command or button again.',
    });
    vi.setSystemTime(1_011_000);
    expect(await commandCooldown(user, 'cmd', 10_000)).toEqual({ success: true });
  });

  it('tracks users and commands separately', async () => {
    const a = { id: 'a' } as GuildMember;
    const b = { id: 'b' } as GuildMember;
    await commandCooldown(a, 'x');
    expect((await commandCooldown(a, 'y')).success).toBe(true);
    expect((await commandCooldown(b, 'x')).success).toBe(true);
    expect((await commandCooldown(a, 'x')).success).toBe(false);
  });
});

describe('RateLimiter', () => {
  const config = {
    defaultLimit: 2, premiumLimit: 5, windowMs: 1000, messageInterval: 2,
  };
  afterEach(() => vi.useRealTimers());

  it('counts queries, blocks at the limit and resets after the window', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(0);
    const limiter = new RateLimiter(config);
    expect(limiter.checkRateLimit('u', false)).toMatchObject({ allowed: true, remaining: 1 });
    expect(limiter.checkRateLimit('u', false)).toMatchObject({ allowed: true, remaining: 0 });
    expect(limiter.checkRateLimit('u', false)).toMatchObject({ allowed: false, remaining: 0, resetTime: 1000 });
    vi.setSystemTime(1500);
    expect(limiter.checkRateLimit('u', false)).toMatchObject({ allowed: true, remaining: 1 });
  });

  it('gives premium users a higher limit and never shows them messages', () => {
    const limiter = new RateLimiter(config);
    expect(limiter.checkRateLimit('p', true).remaining).toBe(4);
    expect(limiter.shouldShowRateLimitMessage('p', true)).toBe(false);
  });

  it('shows messages every N queries, or always without an interval', () => {
    const limiter = new RateLimiter(config);
    limiter.checkRateLimit('u', false);
    expect(limiter.shouldShowRateLimitMessage('u', false)).toBe(false);
    limiter.checkRateLimit('u', false);
    expect(limiter.shouldShowRateLimitMessage('u', false)).toBe(true);
    expect(limiter.shouldShowRateLimitMessage('u', false)).toBe(false);
    expect(new RateLimiter({ ...config, messageInterval: undefined }).shouldShowRateLimitMessage('x', false)).toBe(true);
  });

  it('supports decrement, usage lookup and reset', () => {
    const limiter = new RateLimiter(config);
    limiter.decrementCount('none');
    limiter.checkRateLimit('u', false);
    limiter.checkRateLimit('u', false);
    limiter.decrementCount('u');
    expect(limiter.getUserUsage('u')?.count).toBe(1);
    limiter.resetUserLimit('u');
    expect(limiter.getUserUsage('u')).toBeNull();
    const zero = new RateLimiter(config);
    zero.checkRateLimit('z', false);
    zero.decrementCount('z');
    zero.decrementCount('z');
    expect(zero.getUserUsage('z')?.count).toBe(0);
  });

  it('formats reset times in hours', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(0);
    expect(formatTimeUntilReset(3_600_000)).toBe('1 hour');
    expect(formatTimeUntilReset(7_200_000)).toBe('2 hours');
  });
});

describe('embedTemplate', () => {
  it('adds branding to blank and pre-filled embeds', () => {
    const blank = embedTemplate().data;
    expect(blank.author?.name).toBe('TripSit.Me');
    expect(blank.footer?.text).toBe(env.DISCLAIMER);
    expect(embedTemplate({ title: 'Hi' }).data.title).toBe('Hi');
  });

  it('builds red error embeds with optional text', () => {
    expect(errorEmbed().data.description).toBeUndefined();
    expect(errorEmbed('bad').data).toMatchObject({ description: 'bad', color: 0xED4245 });
  });
});

describe('karma', () => {
  const channelOf = (ctor: { prototype: object }) => stubInstance<TextChannel>(ctor, { send: vi.fn() });
  const msg = (content: string, over: Record<string, unknown> = {}) => ({
    guild: { id: e.DISCORD_GUILD_ID },
    author: { id: 'a', bot: false, username: 'Alice' },
    member: { displayName: 'Ally' },
    content,
    channel: channelOf(TextChannel),
    ...over,
  }) as unknown as Message;

  beforeEach(() => { e.DISCORD_GUILD_ID = 'guild1'; });

  it('mocks users who give themselves karma', async () => {
    const m = msg('alice++', { guild: { id: 'guild1' } });
    await karma(m);
    expect((m.channel as TextChannel).send).toHaveBeenCalledWith('Stop playing with yourself : - )');
    const byNick = msg('Ally--', { guild: { id: 'guild1' } });
    await karma(byNick);
    expect((byNick.channel as TextChannel).send).toHaveBeenCalled();
  });

  it('also works in DMs', async () => {
    const m = msg('alice++', { guild: { id: 'guild1' }, channel: channelOf(DMChannel) });
    await karma(m);
    expect((m.channel as unknown as TextChannel).send).toHaveBeenCalled();
  });

  it('ignores other targets, long names, bots, other guilds and DMs', async () => {
    const other = msg('bob++', { guild: { id: 'guild1' } });
    await karma(other);
    const long = msg(`${'x'.repeat(30)}++`, { guild: { id: 'guild1' } });
    await karma(long);
    const bot = msg('alice++', { guild: { id: 'guild1' }, author: { id: 'b', bot: true, username: 'alice' } });
    await karma(bot);
    const elsewhere = msg('alice++', { guild: { id: 'other' } });
    await karma(elsewhere);
    const noGuild = msg('alice++', { guild: null });
    await karma(noGuild);
    const plain = msg('hello', { guild: { id: 'guild1' } });
    await karma(plain);
    [other, long, bot, elsewhere, noGuild, plain].forEach(m => {
      expect((m.channel as TextChannel).send).not.toHaveBeenCalled();
    });
  });
});

describe('youAre', () => {
  const channel = () => stubInstance<TextChannel>(TextChannel, { send: vi.fn(), parentId: 'other-cat' });
  const msg = (content: string, over: Record<string, unknown> = {}) => ({
    guild: { id: 'guild1' }, cleanContent: content, channel: channel(), member: { displayName: 'Ally' }, ...over,
  }) as unknown as Message;

  beforeEach(() => { e.DISCORD_GUILD_ID = 'guild1'; e.NODE_ENV = 'test'; });
  afterEach(() => vi.restoreAllMocks());

  it('validates regex matches by length', () => {
    expect(valMatch('a', /(a)/, 2)).toBeTruthy();
    expect(valMatch('a', /(a)/, 3)).toBe(false);
    expect(valMatch('b', /(a)/, 2)).toBe(false);
  });

  it('echoes the predicate back without pinging anyone', async () => {
    const m = msg('the sky is very blue.');
    await youAre(m);
    expect((m.channel as TextChannel).send).toHaveBeenCalledWith({
      content: "Ally: You're very blue.", allowedMentions: { parse: [] },
    });
  });

  it.each([
    ['no guild', { guild: null }],
    ['another guild', { guild: { id: 'x' } }],
    ['no predicate', { cleanContent: 'hello there' }],
    ['non-text channel', { channel: {} }],
  ])('does nothing for %s', async (_label, over) => {
    const m = msg('it is cold.', over);
    await youAre(m);
    expect((m.channel as unknown as { send?: ReturnType<typeof vi.fn> }).send?.mock?.calls ?? []).toHaveLength(0);
  });

  it('skips the harm reduction category', async () => {
    const m = msg('it is cold.', { channel: stubInstance<TextChannel>(TextChannel, { send: vi.fn(), parentId: e.CATEGORY_HARMREDUCTIONCENTRE }) });
    await youAre(m);
    expect((m.channel as TextChannel).send).not.toHaveBeenCalled();
  });

  it('only fires about 1% of the time in production', async () => {
    e.NODE_ENV = 'production';
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const quiet = msg('it is cold.');
    await youAre(quiet);
    expect((quiet.channel as TextChannel).send).not.toHaveBeenCalled();
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const loud = msg('it is cold.');
    await youAre(loud);
    expect((loud.channel as TextChannel).send).toHaveBeenCalled();
  });
});
