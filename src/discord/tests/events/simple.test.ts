import { AuditLogEvent, ChannelType } from 'discord.js';
import { debug } from '../../events/debug';
import { warn } from '../../events/warn';
import { invalidRequestWarning } from '../../events/invalidRequestWarning';
import { rateLimit } from '../../events/rateLimit';
import { webhookUpdate } from '../../events/webhookUpdate';
import { emojiUpdate } from '../../events/emojiUpdate';
import { guildBanRemove } from '../../events/guildBanRemove';
import { stickerDelete } from '../../events/stickerDelete';
import { threadCreate } from '../../events/threadCreate';
import { threadUpdate } from '../../events/threadUpdate';
import { threadDelete } from '../../events/threadDelete';
import { channelDelete } from '../../events/channelDelete';
import { guildUpdate } from '../../events/guildUpdate';
import { guildDelete } from '../../events/guildDelete';
import { guildCreate } from '../../events/guildCreate';
import { guildMemberAdd } from '../../events/guildMemberAdd';
import { messageReactionAdd } from '../../events/messageReactionAdd';
import { messageReactionRemove } from '../../events/messageReactionRemove';
import { messageUpdate } from '../../events/messageUpdate';
import { dbMock } from '../../../vitest/utils/mockDb';

const e = env as unknown as Record<string, string>;

const mocks = vi.hoisted(() => ({
  postAuditLog: vi.fn(),
  trust: vi.fn(),
  giveMilestone: vi.fn(),
  chitragupta: vi.fn(),
  bestOf: vi.fn(),
  aiReaction: vi.fn(),
  relayEdit: vi.fn(),
}));

vi.mock('../../utils/auditLog', () => ({ default: mocks.postAuditLog, postAuditLog: mocks.postAuditLog }));
vi.mock('../../utils/trust', () => ({ default: mocks.trust }));
vi.mock('../../../global/utils/experience', () => ({ giveMilestone: mocks.giveMilestone }));
vi.mock('../../utils/chitragupta', () => ({ chitragupta: mocks.chitragupta }));
vi.mock('../../utils/bestOfTripsit', () => ({ bestOf: mocks.bestOf }));
vi.mock('../../commands/global/d.ai', () => ({ aiReaction: mocks.aiReaction }));
vi.mock('../../utils/chatBridge', () => ({ relayDiscordEdit: mocks.relayEdit }));

const send = vi.fn();
const setClient = (extra: Record<string, unknown> = {}) => {
  (global as unknown as { discordClient: unknown }).discordClient = {
    channels: { fetch: vi.fn(async () => ({ send })) },
    guilds: { fetch: vi.fn(), cache: { size: 7 } },
    ...extra,
  };
};

beforeEach(() => setClient());

describe('logging events', () => {
  it('debug is disabled', async () => {
    await debug.execute('info' as never);
    expect(send).not.toHaveBeenCalled();
  });

  it('warn forwards to the bot log', async () => {
    await warn.execute('careful' as never);
    expect(send).toHaveBeenCalledWith('careful');
  });

  it('invalid request warnings go to the error channel', async () => {
    await invalidRequestWarning.execute({ count: 3, remainingTime: 1000 } as never);
    expect(send).toHaveBeenCalledWith(expect.stringContaining('count: 3'));
  });

  it('rate limits are reported with their details', async () => {
    await rateLimit.execute({
      global: false, hash: 'h', limit: 5, majorParameter: 'm', method: 'GET', route: '/x', timeToReset: 10, url: 'u',
    } as never);
    expect(send).toHaveBeenCalledWith(expect.stringContaining('Route: /x'));
  });
});

describe('audit log events', () => {
  const guild = { id: 'g' };
  const cases: Array<[string, { execute: (...args: never[]) => Promise<void> }, unknown[], Record<string, unknown>]> = [
    ['webhookUpdate', webhookUpdate, [{ guild, toString: (): string => '#hook' }], { type: AuditLogEvent.WebhookUpdate, action: 'updated', showChanges: true }],
    ['emojiUpdate', emojiUpdate, [{}, { guild, toString: (): string => ':e:' }], { type: AuditLogEvent.EmojiUpdate, action: 'updated', showChanges: true }],
    ['guildBanRemove', guildBanRemove, [{ guild, user: 'bob' }], { type: AuditLogEvent.MemberBanRemove, action: 'unbanned', subject: 'bob' }],
    ['stickerDelete', stickerDelete, [{ guild, name: 'wave' }], { type: AuditLogEvent.StickerDelete, subject: 'Sticker wave', action: 'deleted' }],
    ['threadCreate', threadCreate, [{ guild, toString: (): string => '#t' }], { type: AuditLogEvent.ThreadCreate, action: 'created' }],
    ['threadUpdate', threadUpdate, [{}, { guild, toString: (): string => '#t' }], { type: AuditLogEvent.ThreadUpdate, action: 'updated', showChanges: true }],
    ['channelDelete', channelDelete, [{ guild, name: 'chat', type: ChannelType.GuildText }], { type: AuditLogEvent.ChannelDelete, subject: 'Channel chat', action: 'deleted' }],
  ];

  it.each(cases)('%s posts an audit log entry', async (_name, event, args, expected) => {
    await event.execute(...(args as never[]));
    expect(mocks.postAuditLog).toHaveBeenCalledWith(expect.objectContaining({ guild, ...expected }));
  });

  it.each([
    ['stickerDelete', stickerDelete, [{ guild: null }]],
    ['threadUpdate', threadUpdate, [{}, { guild: null }]],
    ['channelDelete', channelDelete, [{ type: ChannelType.DM }]],
  ])('%s ignores events without a guild', async (_name, event, args) => {
    await (event as { execute: (...a: never[]) => Promise<void> }).execute(...(args as never[]));
    expect(mocks.postAuditLog).not.toHaveBeenCalled();
  });
});

describe('threadDelete', () => {
  const thread = { guild: { id: 'g' }, id: 't1', toString: (): string => '#t' };

  it('logs the deletion and marks the matching ticket deleted', async () => {
    dbMock.user_tickets.findFirst.mockResolvedValue({ id: 'ticket1' } as never);
    await threadDelete.execute(thread as never);
    expect(mocks.postAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'deleted' }));
    expect(dbMock.user_tickets.update).toHaveBeenCalledWith({ where: { id: 'ticket1' }, data: { status: 'DELETED' } });
  });

  it('does nothing further when no open ticket uses the thread', async () => {
    dbMock.user_tickets.findFirst.mockResolvedValue(null);
    await threadDelete.execute(thread as never);
    expect(dbMock.user_tickets.update).not.toHaveBeenCalled();
  });

  it('ignores threads without a guild', async () => {
    await threadDelete.execute({ guild: null } as never);
    expect(mocks.postAuditLog).not.toHaveBeenCalled();
  });
});

describe('guild lifecycle', () => {
  const guild = (over: object = {}) => ({
    id: 'g1', name: 'Guild', memberCount: 3, description: null, createdAt: new Date(0), leave: vi.fn(), ...over,
  });
  const row = (banned: boolean) => dbMock.discord_guilds.upsert.mockResolvedValue({ is_banned: banned } as never);

  it('guildUpdate leaves banned guilds and logs updates only for tripsit', async () => {
    row(true);
    const g = guild();
    await guildUpdate.execute(g as never, g as never);
    expect(g.leave).toHaveBeenCalled();
    row(false);
    const main = guild({ id: e.DISCORD_GUILD_ID });
    await guildUpdate.execute(main as never, main as never);
    expect(main.leave).not.toHaveBeenCalled();
  });

  it('guildCreate announces new guilds, or leaves if banned', async () => {
    row(false);
    await guildCreate.execute(guild({ description: 'About' }) as never);
    expect(send).toHaveBeenCalledWith(expect.stringContaining('I am now in 7 guilds'));
    expect(send).toHaveBeenCalledWith(expect.stringContaining('Description: About'));
    send.mockClear();
    row(true);
    const banned = guild();
    await guildCreate.execute(banned as never);
    expect(banned.leave).toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('guildDelete records the removal and announces it', async () => {
    await guildDelete.execute(guild() as never);
    expect(dbMock.discord_guilds.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'g1' } }));
    expect(send).toHaveBeenCalledWith(expect.stringContaining('No description'));
  });

  it('guildDelete stays quiet for the ignored guild', async () => {
    await guildDelete.execute(guild({ id: '1026942722612924518' }) as never);
    expect(send).not.toHaveBeenCalled();
  });
});

describe('guildMemberAdd', () => {
  const member = (fetch: () => Promise<unknown>) => ({ id: 'm', fetch, guild: { id: 'g' } });
  const guildRow = (cooperative: boolean | null) => dbMock.discord_guilds.upsert.mockResolvedValue(
    (cooperative === null ? null : { cooperative }) as never,
  );

  it('runs trust and milestone checks in cooperative guilds', async () => {
    guildRow(true);
    const m = member(async () => m);
    await guildMemberAdd.execute(m as never);
    expect(mocks.trust).toHaveBeenCalledWith(m);
    expect(mocks.giveMilestone).toHaveBeenCalledWith(m);
  });

  it.each([[false], [null]])('does nothing for non-cooperative guilds (%s)', async coop => {
    guildRow(coop);
    await guildMemberAdd.execute(member(async () => ({})) as never);
    expect(mocks.trust).not.toHaveBeenCalled();
  });

  it('ignores members who left immediately and rethrows other fetch errors', async () => {
    await guildMemberAdd.execute(member(async () => { throw Object.assign(new Error('Unknown Member'), { code: 10007 }); }) as never);
    expect(mocks.trust).not.toHaveBeenCalled();
    await expect(guildMemberAdd.execute(member(async () => { throw new Error('boom'); }) as never)).rejects.toThrow('boom');
  });

  it('logs processing failures instead of throwing', async () => {
    guildRow(true);
    mocks.trust.mockRejectedValueOnce(new Error('trust failed'));
    await expect(guildMemberAdd.execute(member(async () => ({})) as never)).resolves.toBeUndefined();
  });
});

describe('reaction events', () => {
  const reaction = (over: Record<string, unknown> = {}) => ({
    fetch: vi.fn().mockResolvedValue(undefined), partial: false, message: { fetch: vi.fn(), guild: { id: e.DISCORD_GUILD_ID } }, ...over,
  });
  const user = (bot = false) => ({ bot, id: 'u', displayName: 'U' });

  it('added: scores karma and best-of for humans in tripsit', async () => {
    const r = reaction();
    await messageReactionAdd.execute(r as never, user() as never);
    expect(mocks.aiReaction).toHaveBeenCalled();
    expect(mocks.chitragupta).toHaveBeenCalledWith(r, expect.anything(), 1);
    expect(mocks.bestOf).toHaveBeenCalledWith(r);
  });

  it('added: tolerates fetch failures and skips DMs, other guilds and bots', async () => {
    const failing = reaction({ fetch: vi.fn().mockRejectedValue(new Error('x')) });
    failing.message.fetch.mockRejectedValue(new Error('y'));
    await messageReactionAdd.execute(failing as never, user() as never);
    expect(mocks.chitragupta).toHaveBeenCalled();
    mocks.chitragupta.mockClear();
    await messageReactionAdd.execute(reaction({ message: { fetch: vi.fn(), guild: null } }) as never, user() as never);
    await messageReactionAdd.execute(reaction({ message: { fetch: vi.fn(), guild: { id: 'other' } } }) as never, user() as never);
    await messageReactionAdd.execute(reaction() as never, user(true) as never);
    expect(mocks.chitragupta).not.toHaveBeenCalled();
    expect(mocks.aiReaction).toHaveBeenCalledTimes(3);
  });

  it('removed: reverses karma, fetching partial reactions', async () => {
    const r = reaction({ partial: true });
    await messageReactionRemove.execute(r as never, user() as never);
    expect(r.fetch).toHaveBeenCalled();
    expect(mocks.chitragupta).toHaveBeenCalledWith(r, expect.anything(), -1);
  });

  it('removed: logs partial fetch failures, and ignores bots and other guilds', async () => {
    const r = reaction({ partial: true, fetch: vi.fn().mockRejectedValue({ message: 'gone' }) });
    await messageReactionRemove.execute(r as never, user() as never);
    mocks.chitragupta.mockClear();
    await messageReactionRemove.execute(reaction() as never, user(true) as never);
    await messageReactionRemove.execute(reaction({ message: { guild: { id: 'other' } } }) as never, user() as never);
    expect(mocks.chitragupta).not.toHaveBeenCalled();
  });
});

describe('messageUpdate', () => {
  const msg = (content: string | null, over: Record<string, unknown> = {}) => ({
    content,
    guild: { id: e.DISCORD_GUILD_ID },
    author: { bot: false },
    member: '<@m>',
    url: 'https://m',
    channel: '#chan',
    client: { channels: { fetch: vi.fn(async () => ({ send })) } },
    ...over,
  });

  it('relays the edit and logs old and new content', async () => {
    await messageUpdate.execute(msg('before') as never, msg('after') as never);
    expect(mocks.relayEdit).toHaveBeenCalled();
    const [{ embeds }] = send.mock.calls[0];
    expect(embeds[0].data.fields).toEqual([
      { name: 'Old Message', value: 'before', inline: true }, { name: 'New Message', value: 'after', inline: true },
    ]);
  });

  it('marks missing content and truncates long content', async () => {
    await messageUpdate.execute(msg(null) as never, msg('x'.repeat(2000)) as never);
    const [{ embeds }] = send.mock.calls[0];
    expect(embeds[0].data.fields[0].value).toBe('(Not found)');
    expect(embeds[0].data.fields[1].value).toHaveLength(1024);
  });

  it('survives embeds that cannot be built', async () => {
    await messageUpdate.execute(msg('a') as never, msg('b', { url: 123 }) as never);
    expect(send).toHaveBeenCalled();
  });

  it('only logs human edits inside tripsit', async () => {
    await messageUpdate.execute(msg('a') as never, msg('b', { guild: null }) as never);
    await messageUpdate.execute(msg('a') as never, msg('b', { guild: { id: 'other' } }) as never);
    await messageUpdate.execute(msg('a') as never, msg('b', { author: null }) as never);
    await messageUpdate.execute(msg('a') as never, msg('b', { author: { bot: true } }) as never);
    expect(send).not.toHaveBeenCalled();
    expect(mocks.relayEdit).toHaveBeenCalledTimes(4);
  });
});
