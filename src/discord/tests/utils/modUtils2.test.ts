/* eslint-disable sonarjs/no-duplicate-string */
import { EmbedBuilder, GuildMember } from 'discord.js';
import {
  acknowledgeButton, linkThread, messageModThread, modResponse,
} from '../../utils/modUtils';
import { dbMock } from '../../../vitest/utils/mockDb';
import { stubInstance } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({
  trustScore: vi.fn(), getMember: vi.fn(), counts: vi.fn(), rows: vi.fn(),
}));

vi.mock('../../utils/trustScore', () => ({ tripSitTrustScore: mocks.trustScore, default: mocks.trustScore }));
vi.mock('../../utils/guildMemberLookup', () => ({ getDiscordMember: mocks.getMember }));
vi.mock('../../utils/modHistory', () => ({ modActionCounts: mocks.counts, modHistoryRows: mocks.rows }));
vi.mock('../../../global/commands/g.last', () => ({ last: vi.fn(), default: vi.fn() }));
vi.mock('../../utils/appeal', () => ({ appealAccept: vi.fn(), appealReject: vi.fn() }));

const ID = '111111111111111111';

const member = (id = ID, over: Record<string, unknown> = {}) => stubInstance<GuildMember>(GuildMember, {
  id,
  displayName: `name-${id.slice(-3)}`,
  user: { username: 'user', displayAvatarURL: () => 'https://av' },
  guild: { id: 'g1' },
  roles: { cache: new Set<string>() },
  communicationDisabledUntilTimestamp: null,
  toJSON: () => ({}),
  ...over,
});

beforeEach(() => {
  process.env.DISCORD_GUILD_ID = 'g1';
  mocks.trustScore.mockResolvedValue({ trustScore: 3, tsReasoning: 'r' });
  mocks.counts.mockResolvedValue({});
  mocks.rows.mockReturnValue([]);
  mocks.getMember.mockResolvedValue([]);
  dbMock.user_actions.findMany.mockResolvedValue([]);
  dbMock.users.upsert.mockImplementation((async (args: { where: { discord_id: string } }) => ({ id: `uid-${args.where.discord_id}`, discord_id: args.where.discord_id, mod_thread_id: null })) as never);
  dbMock.discord_guilds.upsert.mockResolvedValue({
    id: 'g1', role_moderator: 'mod-role', channel_moderators: 'modchan', channel_mod_log: 'modlog',
  } as never);
});

const componentIds = (result: { components?: readonly unknown[] }) => JSON.stringify((result.components ?? []).map(c => (c as { toJSON(): unknown }).toJSON?.() ?? c));

describe('modResponse: lookups from commands and buttons', () => {
  function button(targetString: string, over: Record<string, unknown> = {}) {
    const actor = member('999999999999999999', { roles: { cache: new Set(['mod-role']) } });
    const interaction = {
      guild: { id: 'g1', bans: { fetch: vi.fn().mockRejectedValue(new Error('Unknown Ban')) }, members: { fetch: vi.fn().mockRejectedValue(new Error('Unknown Member')) } },
      member: actor,
      customId: `moderate~INFO~${targetString}`,
      isChatInputCommand: () => false,
      isButton: () => true,
      isUserContextMenuCommand: () => false,
      isMessageContextMenuCommand: () => false,
      ...over,
    };
    return { interaction: interaction as never, raw: interaction, actor };
  }

  it('rejects interactions without a guild or member', async () => {
    const result = await modResponse({ guild: null, member: null } as never, 'INFO', true);
    expect(result.embeds?.[0]).toBeDefined();
  });

  it('asks for a more specific target when several members match', async () => {
    mocks.getMember.mockResolvedValue([member('1'), member('2')]);
    const { interaction } = button('moon');
    const result = await modResponse(interaction, 'INFO', true);
    expect((result.embeds?.[0] as EmbedBuilder).data.title).toContain('returned 2 results!');
  });

  it('rejects names that match nobody', async () => {
    const { interaction } = button('nobody');
    const result = await modResponse(interaction, 'INFO', true);
    expect((result.embeds?.[0] as EmbedBuilder).data.title).toBe('"nobody" returned no results!');
  });

  it('offers note/ban/info for ids of users who left, and unban for banned ones', async () => {
    (global as unknown as { discordClient: unknown }).discordClient = { users: { fetch: vi.fn().mockRejectedValue(new Error('Unknown User')), guilds: undefined }, guilds: { fetch: vi.fn() } };
    const left = button(ID);
    const result = await modResponse(left.interaction, 'REPORT', true);
    expect((result.embeds?.[0] as EmbedBuilder).data.description).toContain('is not in the guild, but I can still Note or ban them');
    expect(componentIds(result)).toContain(`moderate~FULL_BAN~${ID}`);

    const banned = button(ID);
    (banned.raw.guild as { bans: { fetch: ReturnType<typeof vi.fn> } }).bans.fetch.mockResolvedValue({ guild: {} });
    const unban = await modResponse(banned.interaction, 'REPORT', true);
    expect((unban.embeds?.[0] as EmbedBuilder).data.description).toContain('un-ban them');
    expect(componentIds(unban)).toContain(`moderate~UN-FULL_BAN~${ID}`);
  });

  it('shows user info for departed users with mentions, using the fetched user when possible', async () => {
    (global as unknown as { discordClient: unknown }).discordClient = { users: { fetch: vi.fn(async () => ({ id: ID, username: 'gone', displayAvatarURL: () => 'https://av' })) } };
    const info = await modResponse(button(`<@${ID}>`).interaction, 'INFO', true);
    expect((info.embeds?.[0] as EmbedBuilder).data.description).toContain(`<@${ID}>`);
    expect(componentIds(info)).toContain(`moderate~INFO~${ID}`);
    const ban = await modResponse(button(ID).interaction, 'FULL_BAN', true);
    expect(componentIds(ban)).toContain('UN-FULL_BAN');
    const appeal = await modResponse(button(ID).interaction, 'BAN_APPEAL', true);
    expect(componentIds(appeal)).toContain('APPEAL_ACCEPT');
    const reporter = await modResponse(button(ID).interaction, 'INFO', false);
    expect(componentIds(reporter)).toContain(`moderate~REPORT~${ID}`);
  });

  it('uses the appeal guild when looking up bans for appeals', async () => {
    const appealBans = { fetch: vi.fn().mockResolvedValue({ guild: {} }) };
    (global as unknown as { discordClient: unknown }).discordClient = {
      users: { fetch: vi.fn().mockRejectedValue(new Error('x')) }, guilds: { fetch: vi.fn(async () => ({ bans: appealBans })) },
    };
    const { interaction } = button(ID);
    await modResponse(interaction, 'REPORT', true, { discordId: ID } as never);
    expect(appealBans.fetch).toHaveBeenCalledWith(ID);
  });

  it('builds the full response for members found by lookup', async () => {
    const target = member(ID);
    mocks.getMember.mockResolvedValue([target]);
    mocks.counts.mockResolvedValue({ NOTE: 1 });
    mocks.rows.mockReturnValue([{ id: 'history-row' }]);
    const { interaction } = button('ally');
    const result = await modResponse(interaction, 'INFO', true);
    const ids = componentIds(result);
    ['NOTE', 'WARNING', 'TIMEOUT', 'FULL_BAN', 'vendorbot'].forEach(part => expect(ids).toContain(part));
    expect(result.components).toHaveLength(2);
  });
});

describe('modResponse: action-specific buttons', () => {
  const ctx = (over: Record<string, unknown> = {}) => ({
    guild: { id: 'g1' },
    member: member('999999999999999999', { roles: { cache: new Set(['mod-role']) } }),
    isChatInputCommand: () => false,
    isButton: () => false,
    isUserContextMenuCommand: () => true,
    isMessageContextMenuCommand: () => false,
    targetMember: member(ID),
    targetUser: { id: ID },
    ...over,
  }) as never;

  it.each([
    ['TIMEOUT', 'UN-TIMEOUT'], ['FULL_BAN', 'UN-FULL_BAN'], ['BAN_APPEAL', 'APPEAL_REJECT'], ['NOTE', 'moderate~INFO'], ['INFO', 'vendorbot'], ['REPORT', 'vendorbot'],
  ])('shows the right buttons after %s', async (command, expected) => {
    const result = await modResponse(ctx(), command as never, true);
    expect(componentIds(result)).toContain(expected);
  });

  it('offers unmute for members who are currently timed out', async () => {
    const muted = member(ID, { communicationDisabledUntilTimestamp: Date.now() + 60_000 });
    const result = await modResponse(ctx({ targetMember: muted }), 'NOTE', true);
    expect(componentIds(result)).toContain('UN-TIMEOUT');
  });

  it('adds an acknowledge button for non-moderator reports, but not for moderators', async () => {
    const reporter = ctx({ member: member('888888888888888888') });
    const reported = await modResponse(reporter, 'REPORT', true);
    expect(componentIds(reported)).toContain('ACKN_REPORT');
    const mod = await modResponse(ctx(), 'REPORT', true);
    expect(componentIds(mod)).not.toContain('ACKN_REPORT');
  });

  it('shows only the report button to non-moderators and adds history rows for moderators', async () => {
    mocks.rows.mockReturnValue([new (await import('discord.js')).ActionRowBuilder()]);
    const plain = await modResponse(ctx(), 'INFO', false);
    expect(componentIds(plain)).toContain(`moderate~REPORT~${ID}`);
    expect(plain.components).toHaveLength(1);
    const mod = await modResponse(ctx(), 'INFO', true);
    expect(mod.components).toHaveLength(2);
  });

  it('quotes the reported message, truncating long content', async () => {
    const targetMessage = {
      member: member(ID), author: { id: ID }, content: 'x'.repeat(1000), url: 'https://msg',
    };
    const result = await modResponse(ctx({ isUserContextMenuCommand: () => false, isMessageContextMenuCommand: () => true, targetMessage }), 'REPORT', true);
    const field = (result.embeds?.[0] as EmbedBuilder).data.fields?.find(f => f.name === 'Message');
    expect(field?.value).toContain('...');
    expect(field?.value).toContain('https://msg');
  });

  it('falls back to the message author when the member left', async () => {
    const targetMessage = {
      member: null, author: { id: ID, username: 'gone', displayAvatarURL: () => 'https://av' }, content: 'hi', url: 'u',
    };
    const result = await modResponse(ctx({ isUserContextMenuCommand: () => false, isMessageContextMenuCommand: () => true, targetMessage }), 'REPORT', false);
    expect(result.embeds).toHaveLength(1);
    const userTarget = await modResponse(ctx({ targetMember: null }), 'NOTE', false);
    expect(userTarget.embeds).toHaveLength(1);
  });
});

describe('modResponse: no interaction', () => {
  it('requires a known actor', async () => {
    await expect(modResponse(null, 'NOTE', true)).rejects.toThrow('valid actor');
  });

  it('supports ban appeals and explicit fallback actors', async () => {
    (global as unknown as { discordClient: unknown }).discordClient = {
      users: { fetch: vi.fn(async (id: string) => ({ id, username: 'appellant', displayAvatarURL: () => 'https://av' })) },
      guilds: { fetch: vi.fn(async () => ({ id: 'g1' })) },
    };
    const appeal = await modResponse(null, 'BAN_APPEAL', true, { discordId: ID } as never);
    expect(componentIds(appeal)).toContain('APPEAL_ACCEPT');
    const fallback = await modResponse(null, 'NOTE', true, null, member('777777777777777777'), member(ID));
    expect(fallback.embeds).toHaveLength(1);
  });

  it('needs the guild id configured and fetchable', async () => {
    (global as unknown as { discordClient: unknown }).discordClient = { guilds: { fetch: vi.fn(async () => null) } };
    await expect(modResponse(null, 'NOTE', true, null, member('777777777777777777'), member(ID))).rejects.toThrow('Failed to fetch guild');
    Reflect.deleteProperty(process.env, 'DISCORD_GUILD_ID');
    await expect(modResponse(null, 'NOTE', true, null, member('777777777777777777'), member(ID))).rejects.toThrow('DISCORD_GUILD_ID');
  });
});

describe('linkThread', () => {
  it('links threads for users without one, or when overriding', async () => {
    expect(await linkThread(ID, 'thread1', false)).toBeNull();
    expect(dbMock.users.update).toHaveBeenCalledWith({ where: { id: `uid-${ID}` }, data: { mod_thread_id: 'thread1' } });
    dbMock.users.upsert.mockResolvedValue({ id: 'u', mod_thread_id: 'existing' } as never);
    expect(await linkThread(ID, 'thread2', true)).toBeNull();
  });

  it('returns the existing thread when not overriding', async () => {
    dbMock.users.upsert.mockResolvedValue({ id: 'u', mod_thread_id: 'existing' } as never);
    expect(await linkThread(ID, 'thread2', false)).toBe('existing');
  });
});

describe('messageModThread', () => {
  const modLog = { send: vi.fn() };
  const modChan = { threads: { create: vi.fn() } };
  const thread = { id: 'thread1', send: vi.fn(), setName: vi.fn() };

  function setup(opts: { threadExists?: boolean; threadFetchFails?: boolean; guild?: Record<string, unknown> } = {}) {
    modChan.threads.create.mockResolvedValue(thread);
    (global as unknown as { discordClient: unknown }).discordClient = {
      users: { fetch: vi.fn(async (id: string) => ({ id, username: 'appellant', displayAvatarURL: () => 'https://av' })) },
      channels: { fetch: vi.fn(async (id: string) => (id === 'modlog' ? modLog : modChan)) },
      guilds: {
        fetch: vi.fn(async () => ({
          channels: { fetch: vi.fn(async () => { if (opts.threadFetchFails) throw new Error('Unknown'); return thread; }) },
          roles: { fetch: vi.fn(async () => ({ toString: (): string => '<@&mods>' })) },
        })),
      },
    };
    dbMock.discord_guilds.upsert.mockResolvedValue({
      id: 'g1', role_moderator: 'mod-role', channel_moderators: 'modchan', channel_mod_log: 'modlog', ...opts.guild,
    } as never);
    dbMock.users.upsert.mockResolvedValue({ id: 'uid', mod_thread_id: opts.threadExists ? 'thread1' : null } as never);
  }
  const actor = () => member('999999999999999999', { displayName: 'Mod' });
  const run = (over: { command?: string; note?: string; desc?: string; extra?: string; duration?: string; appeal?: object | null; dm?: boolean | null; target?: unknown; interaction?: unknown } = {}) => messageModThread(
    (over.interaction ?? null) as never,
    actor(),
    (over.target ?? member(ID, { displayName: 'Target' })) as never,
    (over.command ?? 'WARNING') as never,
    over.note ?? 'internal',
    over.desc ?? 'public',
    over.extra ?? '',
    over.duration ?? '',
    over.appeal as never,
    over.dm,
  );

  it('does nothing when the mod channels are not configured', async () => {
    setup({ guild: { channel_moderators: null } });
    expect(await run()).toBeNull();
    setup({ guild: { channel_mod_log: null } });
    expect(await run()).toBeNull();
  });

  it('logs the action, creates a thread for first-time targets and pings moderators', async () => {
    setup();
    const result = await run({ extra: 'extra info', dm: false });
    expect(result).toBe(thread);
    const [{ content }] = modLog.send.mock.calls[0] as unknown as [{ content: string }];
    expect(content).toContain('was warned');
    expect(content).toContain('**Note sent to user:** public');
    expect(content).toContain('DM delivered to user:** ❌ No');
    expect(modLog.send).toHaveBeenCalledWith({ content: 'extra info' });
    expect(modChan.threads.create).toHaveBeenCalledWith(expect.objectContaining({ name: '🙅│Target' }));
    expect(dbMock.users.update).toHaveBeenCalledWith({ where: { discord_id: ID }, data: { mod_thread_id: 'thread1' } });
    expect((thread.send.mock.calls[0][0] as { content: string }).content).toContain('<@&mods>');
    expect(thread.setName).toHaveBeenCalled();
    expect(thread.send).toHaveBeenLastCalledWith({ content: 'extra info' });
  });

  it('reuses existing threads and skips the moderator ping for plain notes', async () => {
    setup({ threadExists: true });
    await run({
      command: 'NOTE', dm: true, desc: '', note: 'a note',
    });
    expect(modChan.threads.create).not.toHaveBeenCalled();
    expect(modLog.send.mock.calls[0][0].content).toContain(`${'*No message sent to user*'}`);
    expect(modLog.send.mock.calls[0][0].content).toContain('✅ Yes');
    expect((thread.send.mock.calls[0][0] as { content: string }).content).not.toContain('<@&mods>');
  });

  it('creates a replacement thread when the old one was deleted', async () => {
    setup({ threadExists: true, threadFetchFails: true });
    await run();
    expect(modChan.threads.create).toHaveBeenCalled();
  });

  it('records timeout durations, and describes appeals with a separate description message', async () => {
    setup();
    await run({ command: 'TIMEOUT', duration: ' for 1 hour' });
    expect(modLog.send.mock.calls[0][0].content).toContain('timed out for 1 hour');
    modLog.send.mockClear();
    setup();
    await run({ command: 'BAN_APPEAL', appeal: { discordId: ID }, desc: 'Please unban me' });
    expect(modLog.send.mock.calls[0][0].content).toContain('has requested a ban appeal');
    expect(modLog.send.mock.calls[1][0].embeds[0].data.description).toBe('Please unban me');
    expect((thread.send.mock.calls.at(-1)?.[0] as { embeds: unknown[] }).embeds.length).toBeGreaterThan(1);
  });

  it('skips the thread entirely for vendor/bot bans', async () => {
    setup();
    expect(await run({ command: 'FULL_BAN', note: 'Vendor spam' })).toBeNull();
    expect(modChan.threads.create).not.toHaveBeenCalled();
  });

  it('requires a moderator role and a moderator channel to build threads', async () => {
    setup({ guild: { role_moderator: null } });
    await expect(run()).rejects.toThrow('Moderator role id is null');
  });

  it('carries over the message field from the triggering embed, and accepts string targets', async () => {
    setup();
    const embed = { toJSON: () => ({ fields: [{ name: 'Message', value: 'quoted' }] }) };
    const interaction = {
      message: { embeds: [embed] }, guild: { id: 'g1' }, member: actor(), targetMember: member(ID), targetUser: { id: ID }, isButton: () => false, isChatInputCommand: () => false, isUserContextMenuCommand: () => true, isMessageContextMenuCommand: () => false,
    };
    await run({ interaction, target: ID });
    expect(JSON.stringify(modLog.send.mock.calls[0][0].embeds)).toContain('quoted');
  });
});

describe('acknowledgeButton', () => {
  function setup(threadFetch: 'ok' | 'fail' | 'none' = 'ok', updateFails = false) {
    const thread = { send: vi.fn() };
    (global as unknown as { discordClient: unknown }).discordClient = {
      channels: { fetch: vi.fn(async () => { if (threadFetch === 'fail') throw new Error('Unknown'); return thread; }) },
    };
    dbMock.users.upsert.mockResolvedValue({ id: 'uid', mod_thread_id: threadFetch === 'none' ? null : 'thread1' } as never);
    const interaction = {
      user: { id: ID, username: 'user', toString: (): string => '<@user>' },
      message: { embeds: [new EmbedBuilder().setTitle('Warned')] },
      update: updateFails ? vi.fn().mockRejectedValue(new Error('gone')) : vi.fn(),
    };
    return { interaction: interaction as never, raw: interaction, thread };
  }

  it('tells the mod thread and swaps the buttons for a receipt', async () => {
    const s = setup();
    await acknowledgeButton(s.interaction);
    expect(JSON.stringify(s.thread.send.mock.calls[0][0])).toContain('has **acknowledged** their warning');
    const [{ components, embeds }] = s.raw.update.mock.calls[0] as unknown as [{ components: unknown[]; embeds: unknown[] }];
    expect(components).toEqual([]);
    expect(embeds).toHaveLength(2);
  });

  it('copes with missing or deleted mod threads and failed updates', async () => {
    await expect(acknowledgeButton(setup('none').interaction)).resolves.toBeUndefined();
    await expect(acknowledgeButton(setup('fail').interaction)).resolves.toBeUndefined();
    await expect(acknowledgeButton(setup('ok', true).interaction)).resolves.toBeUndefined();
  });
});
