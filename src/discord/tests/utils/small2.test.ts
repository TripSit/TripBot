import { DMChannel, TextChannel } from 'discord.js';
import type { Message } from 'discord.js';
import { awayMessage } from '../../utils/awayMessage';
import { helperActivityUpdate } from '../../utils/helperActivityUpdate';
import commandContext from '../../utils/context';
import { mushroomPageEmbed } from '../../utils/hrUtils';
import { postAuditLog } from '../../utils/auditLog';
import { runPager } from '../../utils/pager';
import { getDiscordMember, getDiscordUser } from '../../utils/guildMemberLookup';
import { dbMock } from '../../../vitest/utils/mockDb';
import { collectionOf, stubInstance } from '../../../vitest/utils/discordStubs';

const e = env as unknown as Record<string, string>;
const mocks = vi.hoisted(() => ({ sleep: vi.fn(), ensure: vi.fn(), getAsset: vi.fn() }));

vi.mock('../../utils/sleep', () => ({ sleep: mocks.sleep }));
vi.mock('../../utils/checkPermissions', () => ({ ensurePermissions: mocks.ensure }));
vi.mock('../../utils/getAsset', () => ({ default: mocks.getAsset }));

type Upsert = Awaited<ReturnType<typeof dbMock.users.upsert>>;

describe('awayMessage', () => {
  afterEach(() => vi.useRealTimers());

  function setup(opts: { mentions?: boolean; timezone?: string | null; hourUtc?: number; recentOwnerMessage?: boolean; olderOwnerMessages?: boolean; channel?: 'text' | 'dm' | 'other' }) {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(Date.UTC(2024, 0, 1, opts.hourUtc ?? 23, 0, 0)));
    dbMock.users.upsert.mockResolvedValue({ timezone: opts.timezone === undefined ? 'UTC' : opts.timezone } as unknown as Upsert);
    const owner = (id: string, ageMs: number): [string, object] => [id, { author: { id: e.DISCORD_OWNER_ID }, createdTimestamp: Date.now() - ageMs }];
    let recent: Array<[string, object]> = [owner('m1', 3 * 3_600_000), ['m2', { author: { id: 'x' }, createdTimestamp: Date.now() }]];
    if (opts.olderOwnerMessages) recent = [owner('m1', 3 * 3_600_000), owner('m2', 5 * 3_600_000), owner('m3', 4 * 3_600_000)];
    if (opts.recentOwnerMessage) recent = [owner('m1', 60_000)];
    const props = { send: vi.fn(), sendTyping: vi.fn(), messages: { fetch: vi.fn(async () => collectionOf(recent)) } };
    const channel = opts.channel === 'other'
      ? props
      : stubInstance(opts.channel === 'dm' ? DMChannel : TextChannel, props);
    const message = {
      mentions: { users: { has: (id: string) => (opts.mentions ?? true) && id === e.DISCORD_OWNER_ID } },
      author: { id: 'u1' },
      member: { displayName: 'Ally' },
      channel,
    } as unknown as Message;
    return { message, channel: channel as typeof props };
  }

  it('tells people the owner is asleep when it is late and they have been quiet', async () => {
    const { message, channel } = setup({});
    await awayMessage(message);
    expect(channel.sendTyping).toHaveBeenCalled();
    expect(channel.send).toHaveBeenCalledWith(expect.stringContaining('Ally'));
  });

  it('looks at the owner\'s newest message when several are older than half an hour', async () => {
    const { message, channel } = setup({ olderOwnerMessages: true });
    await awayMessage(message);
    expect(channel.send).toHaveBeenCalled();
  });

  it('works in DMs too', async () => {
    const { message, channel } = setup({ channel: 'dm', hourUtc: 3 });
    await awayMessage(message);
    expect(channel.send).toHaveBeenCalled();
  });

  it.each([
    ['not mentioned', { mentions: false }],
    ['daytime', { hourUtc: 12 }],
    ['no timezone', { timezone: null }],
    ['owner replied recently', { recentOwnerMessage: true }],
  ])('stays quiet when %s', async (_label, opts) => {
    const { message, channel } = setup(opts);
    await awayMessage(message);
    expect(channel.send).not.toHaveBeenCalled();
  });

  it('logs instead of replying in unsupported channels', async () => {
    const { message, channel } = setup({ channel: 'other' });
    await awayMessage(message);
    expect(channel.send).not.toHaveBeenCalled();
  });
});

describe('helperActivityUpdate', () => {
  beforeEach(() => { e.DISCORD_GUILD_ID = 'guild1'; });
  const make = (over: Record<string, unknown> = {}) => ({
    guild: { id: 'guild1', roles: { fetch: vi.fn(async (id: string) => ({ id })) } },
    channel: stubInstance(TextChannel, { parentId: e.CATEGORY_HARMREDUCTIONCENTRE }),
    member: { roles: { cache: new Set(['helper']) } },
    author: { id: 'a' },
    ...over,
  }) as unknown as Message;
  const guildRow = (role: string | null) => dbMock.discord_guilds.upsert.mockResolvedValue({ role_helper: role } as never);

  it('stamps helper activity for helpers speaking in the harm reduction category', async () => {
    guildRow('helper');
    await helperActivityUpdate(make());
    expect(dbMock.users.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { discord_id: 'a' } }));
  });

  it.each([
    ['no guild', { guild: null }],
    ['another guild', { guild: { id: 'zzz' } }],
    ['non-text channel', { channel: {} }],
    ['another category', { channel: stubInstance(TextChannel, { parentId: 'nope' }) }],
    ['not a helper', { member: { roles: { cache: new Set() } } }],
    ['no member', { member: null }],
  ])('ignores %s', async (_label, over) => {
    guildRow('helper');
    await helperActivityUpdate(make(over));
    expect(dbMock.users.upsert).not.toHaveBeenCalled();
  });

  it('ignores guilds with no helper role configured', async () => {
    guildRow(null);
    await helperActivityUpdate(make());
    expect(dbMock.users.upsert).not.toHaveBeenCalled();
  });

  it('ignores a missing role object', async () => {
    guildRow('helper');
    await helperActivityUpdate(make({ guild: { id: 'guild1', roles: { fetch: vi.fn(async () => null) } } }));
    expect(dbMock.users.upsert).not.toHaveBeenCalled();
  });
});

describe('commandContext', () => {
  const user = { username: 'alice' };

  it('describes DMs and guild invocations', async () => {
    expect(await commandContext({ user, guild: null } as never)).toBe('via alice in DM');
    expect(await commandContext({ user, guild: { name: 'G' } } as never)).toBe('via alice in G');
  });

  it('lists top-level options', async () => {
    const interaction = { user, guild: { name: 'G' }, options: { data: [{ name: 'a', value: 1 }, { name: 'b', value: 'x' }] } };
    expect(await commandContext(interaction as never)).toBe('via alice in G with params: a: 1, b: x');
  });

  it('lists subcommands and their options', async () => {
    const withParams = { user, guild: null, options: { data: [{ options: [{ name: 'a', value: 1 }] }], getSubcommand: () => 'sub' } };
    expect(await commandContext(withParams as never)).toBe('via alice in DM subCommand: sub with params: a: 1');
    const noParams = { user, guild: null, options: { data: [{ options: [] }], getSubcommand: () => 'sub' } };
    expect(await commandContext(noParams as never)).toBe('via alice in DM subCommand: sub');
    const empty = { user, guild: null, options: { data: [] } };
    expect(await commandContext(empty as never)).toBe('via alice in DM');
  });

  it('includes component custom ids', async () => {
    expect(await commandContext({ user, guild: null, customId: 'btn' } as never)).toContain('with customId: btn');
  });
});

describe('mushroomPageEmbed', () => {
  beforeEach(() => mocks.getAsset.mockResolvedValue(Buffer.from('img')));

  it('shows the data page with a link to the visual', async () => {
    const page = await mushroomPageEmbed(1);
    expect(page.embeds[0].data.image?.url).toBe('attachment://mushroomInfoA.png');
    expect(mocks.getAsset).toHaveBeenCalledWith('mushroomInfoA');
    expect(JSON.stringify(page.components[0].toJSON())).toContain('mushroomPageTwo');
  });

  it('shows the visual page otherwise, and keeps the research disclaimer', async () => {
    const page = await mushroomPageEmbed(2);
    expect(page.embeds[0].data.image?.url).toBe('attachment://mushroomInfoB.png');
    expect(page.embeds[0].data.description).toContain('preliminary research');
    expect(JSON.stringify(page.components[0].toJSON())).toContain('mushroomPageOne');
  });
});

describe('postAuditLog', () => {
  const entry = (over: object = {}) => ({
    executor: { tag: 'mod#1' }, changes: [{ key: 'name', old: 'a', new: 'b' }], ...over,
  });
  function setup(first: unknown) {
    const send = vi.fn();
    (global as unknown as { discordClient: unknown }).discordClient = { channels: { fetch: vi.fn(async () => ({ send })) } };
    const guild = { id: e.DISCORD_GUILD_ID, fetchAuditLogs: vi.fn(async () => ({ entries: { first: () => first } })) };
    return { send, guild };
  }
  const run = (guild: unknown, extra: object = {}) => postAuditLog({
    guild: guild as never, type: 1 as never, subject: 'Thread x', action: 'created', caller: 'F', ...extra,
  });

  beforeEach(() => { mocks.ensure.mockResolvedValue(true); });

  it('credits the executor', async () => {
    const { send, guild } = setup(entry());
    await run(guild);
    expect(send).toHaveBeenCalledWith('Thread x was created by mod#1.');
  });

  it('lists the changes when asked', async () => {
    const { send, guild } = setup(entry());
    await run(guild, { showChanges: true });
    expect(send).toHaveBeenCalledWith("Thread x was created by mod#1:\n**[name]** '**a**' > '**b**'");
  });

  it('handles missing entries and executors', async () => {
    let s = setup(undefined);
    await run(s.guild);
    expect(s.send).toHaveBeenCalledWith('Thread x was created, but no relevant audit logs were found.');
    s = setup(entry({ executor: null }));
    await run(s.guild, { showChanges: true });
    expect(s.send).toHaveBeenCalledWith(expect.stringContaining('the audit log was inconclusive'));
  });

  it('does nothing in other guilds, without a guild, or without permissions', async () => {
    const { send, guild } = setup(entry());
    await run({ ...guild, id: 'other' });
    await run(null);
    mocks.ensure.mockResolvedValueOnce(false);
    await run(guild);
    mocks.ensure.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await run(guild);
    expect(send).not.toHaveBeenCalled();
  });
});

describe('runPager', () => {
  function setup() {
    const handlers: Record<string, (arg?: unknown) => Promise<void>> = {};
    const collector = { on: vi.fn((event: string, fn: (arg?: unknown) => Promise<void>) => { handlers[event] = fn; }) };
    const message = { createMessageComponentCollector: vi.fn(() => collector) };
    const interaction = { user: { id: 'u' }, editReply: vi.fn(async () => message) };
    const renderPage = vi.fn(async (i: number) => ({ embeds: [{ page: i }] as never }));
    return {
      handlers, interaction, renderPage, message,
    };
  }
  const click = (customId: string) => ({ customId, deferUpdate: vi.fn() });

  it('renders the first page and lets the user page back and forth within bounds', async () => {
    const { handlers, interaction, renderPage } = setup();
    await runPager(interaction as never, { pageCount: 3, renderPage, idPrefix: 'p' });
    expect(renderPage).toHaveBeenCalledWith(0);
    await handlers.collect(click('pNext'));
    await handlers.collect(click('pNext'));
    await handlers.collect(click('pNext'));
    expect(renderPage).toHaveBeenLastCalledWith(2);
    await handlers.collect(click('pBack'));
    await handlers.collect(click('pBack'));
    await handlers.collect(click('pBack'));
    expect(renderPage).toHaveBeenLastCalledWith(0);
  });

  it('only accepts the invoking user\'s paging buttons', async () => {
    const { interaction, renderPage, message } = setup();
    await runPager(interaction as never, { pageCount: 2, renderPage, idPrefix: 'p' });
    const { filter } = (message.createMessageComponentCollector.mock.calls[0] as unknown as [{ filter: (i: unknown) => boolean }])[0];
    expect(filter({ user: { id: 'u' }, customId: 'pNext' })).toBe(true);
    expect(filter({ user: { id: 'x' }, customId: 'pNext' })).toBe(false);
    expect(filter({ user: { id: 'u' }, customId: 'other' })).toBe(false);
  });

  it('disables the buttons when the collector ends, even if the message is gone', async () => {
    const { handlers, interaction, renderPage } = setup();
    await runPager(interaction as never, { pageCount: 2, renderPage, idPrefix: 'p' });
    await handlers.end();
    const last = interaction.editReply.mock.calls.at(-1) as unknown as [{ components: Array<{ toJSON(): { components: Array<{ disabled: boolean }> } }> }];
    expect(last[0].components[0].toJSON().components.every(c => c.disabled)).toBe(true);
    interaction.editReply.mockRejectedValueOnce(new Error('Unknown Message'));
    await expect(handlers.end()).resolves.toBeUndefined();
  });

  it('skips the controls for single pages', async () => {
    const { interaction, renderPage, message } = setup();
    await runPager(interaction as never, {
      pageCount: 1, renderPage, idPrefix: 'p', showControls: false, startIndex: 0,
    });
    expect(interaction.editReply).toHaveBeenCalledWith(expect.objectContaining({ components: [] }));
    expect(message.createMessageComponentCollector).not.toHaveBeenCalled();
  });
});

describe('guildMemberLookup', () => {
  const member = (tag: string) => ({ user: { tag }, displayName: tag });
  function interaction(fetch: ReturnType<typeof vi.fn>) {
    return { guild: { members: { fetch } } } as never;
  }

  it('returns nothing outside guilds', async () => {
    expect(await getDiscordMember({ guild: null } as never, 'x')).toEqual([]);
  });

  it('resolves mentions and raw ids, tolerating departed members', async () => {
    const fetch = vi.fn(async (id: string) => member(id));
    expect(await getDiscordMember(interaction(fetch), '<@!123>')).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith('123');
    expect(await getDiscordMember(interaction(fetch), '456')).toHaveLength(1);
    const gone = vi.fn().mockRejectedValue(new Error('Unknown Member'));
    expect(await getDiscordMember(interaction(gone), '<@1>')).toEqual([]);
    expect(await getDiscordMember(interaction(gone), '1')).toEqual([]);
  });

  it('matches tags exactly', async () => {
    const fetch = vi.fn(async () => collectionOf({ a: member('a#1'), b: member('b#2') }));
    const result = await getDiscordMember(interaction(fetch), 'a#1');
    expect(result.map(m => m.user.tag)).toEqual(['a#1']);
  });

  it('searches by name for @names and plain usernames', async () => {
    const fetch = vi.fn(async () => collectionOf({ a: member('alice') }));
    expect(await getDiscordMember(interaction(fetch), '@ali')).toHaveLength(1);
    expect(fetch).toHaveBeenLastCalledWith({ query: 'ali', limit: 10 });
    expect(await getDiscordMember(interaction(fetch), 'ali')).toHaveLength(1);
    expect(fetch).toHaveBeenLastCalledWith({ query: 'ali', limit: 10 });
  });

  it('looks users up globally by mention or id', async () => {
    const fetch = vi.fn(async (id: string) => ({ id }));
    (global as unknown as { discordClient: unknown }).discordClient = { users: { fetch } };
    expect(await getDiscordUser('<@!5>')).toEqual({ id: '5' });
    expect(await getDiscordUser('6')).toEqual({ id: '6' });
    expect(await getDiscordUser('name')).toEqual({});
    fetch.mockRejectedValue(new Error('Unknown User'));
    expect(await getDiscordUser('<@5>')).toBeNull();
    expect(await getDiscordUser('7')).toBeNull();
  });
});
