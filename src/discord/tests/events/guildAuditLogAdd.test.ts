/* eslint-disable no-bitwise, no-restricted-syntax, max-len, sonarjs/no-duplicate-string, @typescript-eslint/no-explicit-any */
import { AuditLogEvent, PermissionFlagsBits } from 'discord.js';
import {
  createActionDescription, formatChange, formatPermissionDiff, getActionEmoji, guildAuditLogEntryCreate, isAutoModAction,
} from '../../events/guildAuditLogAdd';

const e = env as unknown as Record<string, string>;

describe('formatPermissionDiff', () => {
  const send = PermissionFlagsBits.SendMessages;
  const view = PermissionFlagsBits.ViewChannel;

  it('lists added and removed permissions', () => {
    expect(formatPermissionDiff(String(view), String(view | send))).toBe('+ SendMessages');
    expect(formatPermissionDiff(String(view | send), String(view))).toBe('- SendMessages');
    expect(formatPermissionDiff(String(send), String(view))).toBe('+ ViewChannel\n- SendMessages');
  });

  it('reports no change, null inputs and invalid values', () => {
    expect(formatPermissionDiff(String(view), String(view))).toBe('No effective change');
    expect(formatPermissionDiff(null, undefined)).toBe('No effective change');
    expect(formatPermissionDiff('not-a-number', 'x')).toBe('No effective change');
  });
});

describe('isAutoModAction / getActionEmoji', () => {
  it('recognises AutoMod actions only', () => {
    expect(isAutoModAction(AuditLogEvent.AutoModerationBlockMessage)).toBe(true);
    expect(isAutoModAction(AuditLogEvent.MemberKick)).toBe(false);
  });

  it.each([
    ['Create', 'Channel', '✅'], ['Delete', 'Role', '❌'], ['Update', 'User', '👤'], ['Update', 'Role', '🏷️'],
    ['Update', 'Channel', '📝'], ['Update', 'Guild', '🏠'], ['Update', 'Emoji', '📝'], ['All', 'User', '📋'],
  ])('%s %s -> %s', (action, target, emoji) => {
    expect(getActionEmoji(action, target)).toBe(emoji);
  });
});

describe('formatChange', () => {
  const change = (key: string, oldValue: unknown, newValue: unknown) => formatChange({ key, old: oldValue, new: newValue }, 'Channel');

  it.each([
    ['nick', 'a', 'b', '**Nickname:** a → b'],
    ['nickname', null, 'b', '**Nickname:** No nickname → b'],
    ['avatar', 'x', 'y', '**Avatar:** Changed'],
    ['avatar', null, 'y', '**Avatar:** Changed'],
    ['deaf', false, true, '**Server Deafened:** No → Yes'],
    ['mute', true, false, '**Server Muted:** Yes → No'],
    ['name', 'a', 'b', '**Name:** a → b'],
    ['topic', null, 'hi', '**Topic:** None → hi'],
    ['position', 1, 2, '**Position:** 1 → 2'],
    ['color', 1, 2, '**Color:** 1 → 2'],
    ['hoist', false, true, '**Display Separately:** No → Yes'],
    ['mentionable', true, false, '**Mentionable:** Yes → No'],
    ['nsfw', false, true, '**NSFW:** No → Yes'],
    ['slowmode', 0, 5, '**Slowmode:** Off → 5s'],
    ['rate_limit_per_user', 10, 0, '**Slowmode:** 10s → Off'],
    ['bitrate', 0, 64, '**Bitrate:** Default → 64kbps'],
    ['bitrate', 32, 0, '**Bitrate:** 32kbps → Default'],
    ['user_limit', 0, 5, '**User Limit:** Unlimited → 5'],
    ['something_else', 'a', 'b', '**Something_else:** a → b'],
  ])('%s', (key, oldValue, newValue, expected) => {
    expect(change(key, oldValue, newValue)).toBe(expected);
  });

  it('handles timeouts', () => {
    expect(change('communication_disabled_until', null, '2030-01-01T00:00:00Z')).toMatch(/^\*\*Timeout:\*\* Until /);
    expect(change('communication_disabled_until', '2030-01-01T00:00:00Z', null)).toBe('**Timeout:** Removed');
  });

  it('handles role add/remove for users and other targets', () => {
    const roles = [{ id: '1', name: 'Mod', color: 5 }];
    expect(formatChange({ key: '$add', new: roles }, 'User')).toBe('**Roles Added:** @Mod');
    expect(formatChange({ key: '$add', new: roles }, 'Channel')).toBe('**Added:** @Mod');
    expect(formatChange({ key: '$remove', new: roles }, 'User')).toBe('**Roles Removed:** @Mod');
    expect(formatChange({ key: '$remove', new: [] }, 'Role')).toBe('**Removed:** None');
  });

  it('formats permission keys as diffs', () => {
    const view = String(PermissionFlagsBits.ViewChannel);
    expect(change('permissions', '0', view)).toContain('+ ViewChannel');
    expect(change('allow', '0', view)).toContain('**Permissions Allowed:**');
    expect(change('deny', view, '0')).toContain('**Permissions Denied:**\n- ViewChannel');
  });

  it('formats rich values: users, channels, plain objects, circular objects, permission strings', () => {
    expect(change('target', { id: '1', username: 'bob' }, { id: '2', name: 'general' })).toBe('**Target:** @bob → #general');
    expect(change('data', { a: 1 }, 'x')).toContain('"a": 1');
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(change('data', circular, null)).toBe('**Data:** [Complex object] → None');
    const view = String(PermissionFlagsBits.ViewChannel);
    expect(change('default_member_permissions', view, '0')).toBe('**Default_member_permissions:** ViewChannel → No permissions');
    expect(change('permission_overwrites', 'abc', 'not-numeric')).toBe('**Permission_overwrites:** abc → not-numeric');
    expect(change('avatar_hash', null, null)).toBe('**Avatar_hash:** None → None');
    expect(change('default_member_permissions', '1.5', '0')).toContain('1.5');
    expect(change('flags', 3, 4)).toBe('**Flags:** 3 → 4');
    expect(change('communication_disabled_until', null, null)).toBe('**Timeout:** Removed');
    expect(change('avatar_hash', null, null)).toBe('**Avatar_hash:** None → None');
    for (const [key, text] of [['banner', 'No banner'], ['timeout', 'No timeout']] as const) {
      expect(change(key, null, 'x')).toContain(text);
    }
  });
});

describe('createActionDescription', () => {
  const entry = (targetType: string, actionType: string, over: Record<string, unknown> = {}) => ({
    executor: { tag: 'mod#1' }, target: { name: 'thing', tag: undefined }, targetType, actionType, action: 0, ...over,
  });

  it.each([
    [AuditLogEvent.MemberBanAdd, '**Victim** was banned'],
    [AuditLogEvent.MemberBanRemove, '**Victim** was unbanned'],
    [AuditLogEvent.MemberKick, '**mod#1** kicked **Victim**'],
    [AuditLogEvent.MemberPrune, '**mod#1** pruned inactive members'],
    [AuditLogEvent.MemberUpdate, '**mod#1** updated member **Victim**'],
    [AuditLogEvent.MemberRoleUpdate, '**mod#1** updated member **Victim**'],
    [AuditLogEvent.MemberMove, '**mod#1** moved **Victim** to another voice channel'],
    [AuditLogEvent.MemberDisconnect, '**mod#1** disconnected **Victim** from voice'],
    [AuditLogEvent.BotAdd, '**mod#1** added bot **Victim**'],
    [AuditLogEvent.AutoModerationBlockMessage, 'AutoMod blocked a message from **Victim**'],
    [AuditLogEvent.AutoModerationFlagToChannel, 'AutoMod flagged a message from **Victim**'],
    [AuditLogEvent.AutoModerationUserCommunicationDisabled, 'AutoMod timed out **Victim**'],
  ])('user action %s', (action, text) => {
    expect(createActionDescription(entry('User', 'Update', { action, target: { username: 'Victim' } }))).toBe(text);
  });

  it('falls back to a generic sentence for unmapped user actions', () => {
    expect(createActionDescription(entry('User', 'Create', { action: AuditLogEvent.EmojiCreate, target: { username: 'V' } }))).toBe('**mod#1** created user **V**');
  });

  it.each([
    ['Role', 'Create', '**mod#1** created role **thing**'],
    ['Role', 'Update', '**mod#1** updated role **thing**'],
    ['Role', 'Delete', '**mod#1** deleted role **thing**'],
    ['Channel', 'Create', '**mod#1** created channel **#thing**'],
    ['Channel', 'Update', '**mod#1** updated channel **#thing**'],
    ['Channel', 'Delete', '**mod#1** deleted channel **#thing**'],
    ['Guild', 'Update', '**mod#1** updated server settings'],
    ['Emoji', 'Create', '**mod#1** added emoji **:thing:**'],
    ['Emoji', 'Update', '**mod#1** updated emoji **:thing:**'],
    ['Emoji', 'Delete', '**mod#1** deleted emoji **:thing:**'],
    ['Webhook', 'Create', '**mod#1** created webhook **thing**'],
    ['Webhook', 'Update', '**mod#1** updated webhook **thing**'],
    ['Webhook', 'Delete', '**mod#1** deleted webhook **thing**'],
    ['AutoModeration', 'Create', 'AutoMod took action'],
    ['Auto_Moderation', 'Update', '**mod#1** updated AutoMod rule **thing**'],
    ['Automod', 'Delete', '**mod#1** deleted AutoMod rule **thing**'],
    ['Automod', 'All', 'AutoMod action triggered'],
    ['Invite', 'Create', '**mod#1** created invite'],
    ['Invite', 'Delete', '**mod#1** deleted invite'],
  ])('%s %s', (targetType, actionType, text) => {
    expect(createActionDescription(entry(targetType, actionType))).toBe(text);
  });

  it('uses placeholder names when the executor or target is missing', () => {
    expect(createActionDescription(entry('Role', 'Delete', { executor: null, target: null }))).toBe('**System** deleted role **a role**');
    expect(createActionDescription(entry('Channel', 'Delete', { target: null }))).toBe('**mod#1** deleted channel **#a channel**');
    expect(createActionDescription(entry('Emoji', 'Create', { target: null }))).toBe('**mod#1** added emoji **:unknown:**');
    expect(createActionDescription(entry('Webhook', 'Update', { target: null }))).toBe('**mod#1** updated webhook **a webhook**');
    expect(createActionDescription(entry('Automod', 'Update', { target: null }))).toContain('a rule');
    expect(createActionDescription(entry('Role', 'Create', { executor: { username: 'u' }, target: null }))).toBe('**u** created role **Unknown Target**');
  });

  it('falls through to the generic sentence for unmapped actions and target types', () => {
    expect(createActionDescription(entry('Role', 'All'))).toBe('**mod#1** alled role **thing**');
    expect(createActionDescription(entry('Invite', 'Update'))).toBe('**mod#1** updated invite **thing**');
    expect(createActionDescription(entry('Emoji', 'All'))).toBe('**mod#1** alled emoji **thing**');
    expect(createActionDescription(entry('Webhook', 'All'))).toBe('**mod#1** alled webhook **thing**');
    expect(createActionDescription(entry('Sticker', 'Create'))).toBe('**mod#1** created sticker **thing**');
    expect(createActionDescription(entry('Sticker', 'Delete'))).toBe('**mod#1** deleted sticker ');
    expect(createActionDescription(entry('Sticker', 'Update'))).toBe('**mod#1** updated sticker **thing**');
  });
});

describe('guildAuditLogEntryCreate', () => {
  const send = vi.fn();
  const guildId = () => e.DISCORD_GUILD_ID;
  const botId = 'bot';
  const guild = (members: unknown = { fetch: vi.fn() }, id = guildId()) => ({ id, client: { user: { id: botId } }, members });
  const executor = (id = 'u1') => ({ id, tag: 'mod#1', displayAvatarURL: () => 'https://av' });
  const base = (over: Record<string, unknown> = {}) => ({
    targetType: 'Channel', actionType: 'Create', action: AuditLogEvent.ChannelCreate, executor: executor(), target: { name: 'new' }, changes: [{ key: 'name', old: null, new: 'x' }], reason: null, ...over,
  });
  const footer = () => (send.mock.calls.at(-1)?.[0].embeds[0].data.footer?.text as string | undefined);
  const run = (entry: unknown, g: unknown = guild()) => guildAuditLogEntryCreate.execute(entry as never, g as never);

  beforeEach(() => {
    send.mockReset();
    (global as unknown as Record<string, unknown>).discordClient = { channels: { fetch: vi.fn(async () => ({ send })) } };
  });

  it('ignores other guilds and message events', async () => {
    await run(base(), guild({}, 'other'));
    await run(base({ targetType: 'Message' }));
    expect(send).not.toHaveBeenCalled();
  });

  it('reports a missing channel and send failures without throwing', async () => {
    (global as unknown as Record<string, unknown>).discordClient = { channels: { fetch: vi.fn(async () => null) } };
    await expect(run(base())).resolves.toBeUndefined();
    (global as unknown as Record<string, unknown>).discordClient = { channels: { fetch: vi.fn().mockRejectedValue(new Error('x')) } };
    await expect(run(base())).resolves.toBeUndefined();
  });

  it.each([['Create', 0x57F287], ['Update', 0xFEE75C], ['Delete', 0xED4245], ['All', 0x3498DB]])('colours %s entries', async (actionType, color) => {
    await run(base({ actionType }));
    const { data } = send.mock.calls[0][0].embeds[0];
    expect(data.color).toBe(color);
    expect(data.title).toContain(`Channel ${actionType}`);
    expect(data.description).toContain('**Name:** None');
  });

  it('appends a plain reason, with an executor footer', async () => {
    await run(base({ reason: 'cleanup', changes: [] }));
    expect(send.mock.calls[0][0].embeds[0].data.description).toContain('**Reason:** cleanup');
    expect(footer()).toBe('Action by mod#1');
  });

  it('shows the AutoMod rule name when present, and attributes the triggering member', async () => {
    const members = { fetch: vi.fn(async () => ({ user: { tag: 'trigger#2', displayAvatarURL: () => 'https://av' } })) };
    const autoMod = (extra: unknown, executorId: string | null) => base({
      targetType: 'AutoModeration', action: AuditLogEvent.AutoModerationBlockMessage, executor: null, executorId, reason: 'bad word', extra, changes: null, target: { username: 'V' },
    });
    await run(autoMod({ autoModerationRuleName: 'No slurs' }, 'u9'), guild(members));
    expect(send.mock.calls[0][0].embeds[0].data.description).toContain('**Rule:** No slurs\n**Reason:** bad word');
    expect(footer()).toBe('Triggered by trigger#2');
    await run(autoMod(null, 'u9'), guild(members));
    expect(send.mock.calls[1][0].embeds[0].data.description).toContain('\n\n**Reason:** bad word');
    expect(send.mock.calls[1][0].embeds[0].data.description).not.toContain('**Rule:**');
  });

  it('falls back when the triggering member cannot be fetched, or the action is automated', async () => {
    const gone = { fetch: vi.fn().mockRejectedValue(new Error('unknown member')) };
    const autoMod = (executorId: string | null) => base({
      targetType: 'AutoModeration', action: AuditLogEvent.AutoModerationFlagToChannel, executor: null, executorId, reason: null, changes: [], target: { username: 'V' },
    });
    await run(autoMod('u9'), guild(gone));
    expect(footer()).toBe('Triggered by user u9');
    await run(autoMod(botId));
    expect(footer()).toBe('Automated action');
    await run(autoMod(null));
    expect(footer()).toBe('Automated action');
  });

  it('does not credit the bot itself as the actor', async () => {
    await run(base({ executor: executor(botId) }));
    expect(footer()).toBeUndefined();
  });
});
