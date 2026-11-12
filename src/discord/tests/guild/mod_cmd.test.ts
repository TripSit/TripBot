/* eslint-disable max-len, sonarjs/no-duplicate-string */
import { ChannelType, TextChannel } from 'discord.js';
import { dMod, lockdown, slowMode } from '../../commands/guild/d.mod';
import { lastReply, slashStub } from '../../../vitest/utils/commandStubs';
import { stubInstance } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({
  freezes: vi.fn(), niceLevel: 69, removeFreeze: vi.fn(), setFreeze: vi.fn(), deleteWatch: vi.fn(), watch: vi.fn(), totalLevel: vi.fn(), link: vi.fn(),
}));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/commands/g.levelFreeze', () => ({
  getAllLevelFreezes: mocks.freezes, NICE_LEVEL: mocks.niceLevel, removeLevelFreeze: mocks.removeFreeze, setLevelFreeze: mocks.setFreeze,
}));
vi.mock('../../../global/commands/g.watchuser', () => ({ deleteWatchRequest: mocks.deleteWatch, executeWatch: mocks.watch }));
vi.mock('../../../global/utils/experience', () => ({ getUserTotalLevel: mocks.totalLevel, MAX_EXPERIENCE_LEVEL: 100, MIN_EXPERIENCE_LEVEL: 1 }));
vi.mock('../../utils/modUtils', () => ({ linkThread: mocks.link }));

const e = env as unknown as Record<string, string>;
const content = (s: ReturnType<typeof slashStub>) => lastReply(s).content as string;
const botlog = () => ({ send: vi.fn() });
const target = { id: 't1', username: 'tee' };

const guildOf = (over: Record<string, unknown> = {}) => {
  const log = botlog();
  const roles = { everyone: { id: 'everyone' }, fetch: vi.fn(async (id: string) => ({ id })) };
  const guild = {
    id: e.DISCORD_GUILD_ID.toString(),
    roles,
    channels: { fetch: vi.fn(async () => log), cache: { get: vi.fn(() => stubInstance(TextChannel, { type: ChannelType.GuildText })) } },
    ...over,
  };
  return { guild, log };
};
const modMember = () => ({ displayName: 'Mod', roles: { cache: { has: () => true } } });

const run = async (subcommand: string, options: Record<string, unknown> = {}, over: Record<string, unknown> = {}) => {
  const { guild, log } = guildOf();
  const stub = slashStub({
    subcommand, options, guild, member: modMember(), ...over,
  });
  const result = await dMod.execute(stub as never);
  return { stub, result, log };
};

describe('mod dispatch', () => {
  it('ignores other guilds and non-moderators', async () => {
    const other = await run('lockdown', {}, { guild: { id: 'nope', roles: {} } });
    expect(other.result).toBe(false);
    const { guild } = guildOf();
    const stub = slashStub({ subcommand: 'lockdown', guild, member: { roles: { cache: { has: () => false } } } });
    expect(await dMod.execute(stub as never)).toBe(false);
    expect(content(stub)).toContain('do not have permission');
  });

  it('level-freeze commands are always ephemeral', async () => {
    mocks.freezes.mockResolvedValue([]);
    const { stub } = await run('frozenlevels');
    expect(stub.deferReply).toHaveBeenCalledWith({ flags: expect.anything() });
  });

  it('unknown subcommands do nothing', async () => {
    expect((await run('zzz')).result).toBe(true);
  });

  it.each([
    ['watchuser', { target, notification_method: 'dm', alert_channel: { type: ChannelType.GuildText } }, 'notified', () => mocks.watch.mockResolvedValueOnce(true)],
    ['freezelevel', { target, level: 20 }, 'frozen at 20', () => mocks.setFreeze.mockResolvedValueOnce(undefined)],
    ['unfreezelevel', { target }, 'no longer frozen', () => mocks.removeFreeze.mockResolvedValueOnce(true)],
  ] as const)('%s confirms the action when the bot log channel is missing', async (subcommand, options, confirmation, prepare) => {
    const { guild } = guildOf();
    const fetch = vi.fn().mockResolvedValue(null);
    prepare();
    const { stub, result } = await run(subcommand, options, {
      guild: { ...guild, channels: { ...guild.channels, fetch } },
    });
    expect(result).toBe(true);
    expect(content(stub)).toContain(confirmation);
    expect(fetch).toHaveBeenCalledExactlyOnceWith(e.CHANNEL_BOTLOG);
  });
});

describe('slowmode', () => {
  const chan = (over = {}) => stubInstance<TextChannel>(TextChannel, { setRateLimitPerUser: vi.fn(), toString: (): string => '#c', ...over });
  const call = (limit: string, channel: unknown, mods: unknown = botlog()) => {
    const stub = slashStub({
      options: { limit }, channel, member: modMember(), guild: { channels: { fetch: vi.fn(async () => mods) } },
    });
    return { stub, mods: mods as ReturnType<typeof botlog> };
  };

  it('needs a text channel', async () => {
    const { stub } = call('5', { id: 'x' });
    expect(await slowMode(stub as never)).toBe(false);
  });

  it('enables, disables and announces', async () => {
    const c = chan();
    const on = await run('slowmode', { limit: '30' }, { channel: c });
    expect(on.result).toBe(true);
    expect(c.setRateLimitPerUser).toHaveBeenCalledWith(30);
    expect(on.log.send).toHaveBeenCalledWith({ content: expect.stringContaining('(30s)') });
    const off = call('0', c);
    await slowMode(off.stub as never);
    expect(content(off.stub)).toContain('disabled');
  });

  it('reports failures', async () => {
    const { stub } = call('5', chan({ setRateLimitPerUser: vi.fn().mockRejectedValue(new Error('perm')) }));
    expect(await slowMode(stub as never)).toBe(false);
    expect(content(stub)).toBe('Failed to set slowmode.');
  });
});

describe('lockdown', () => {
  const lockChannel = (locked: boolean) => stubInstance<TextChannel>(TextChannel, {
    permissionOverwrites: {
      cache: { get: vi.fn(() => (locked ? { deny: { has: () => true } } : undefined)) },
      edit: vi.fn(),
    },
    toString: (): string => '#c',
  });

  it('validates channel and guild', async () => {
    expect(await lockdown(slashStub({ channel: { id: 'x' } }) as never)).toBe(false);
    expect(await lockdown(slashStub({ channel: lockChannel(false), guild: null }) as never)).toBe(false);
  });

  it('locks, then unlocks', async () => {
    const lock = lockChannel(false);
    const { stub, result } = await run('lockdown', {}, { channel: lock });
    expect(result).toBe(true);
    expect(content(stub)).toContain('locked down');
    expect((lock.permissionOverwrites.edit as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(1);
    expect(lock.permissionOverwrites.edit).toHaveBeenCalledWith({ id: 'everyone' }, expect.objectContaining({ SendMessages: false }));
    expect(lock.permissionOverwrites.edit).toHaveBeenCalledWith({ id: e.ROLE_MODERATOR }, expect.objectContaining({ SendMessages: true }));
    const unlock = lockChannel(true);
    const stub2 = slashStub({ channel: unlock, guild: guildOf().guild });
    await lockdown(stub2 as never);
    expect(content(stub2)).toContain('unlocked');
    expect(unlock.permissionOverwrites.edit).toHaveBeenCalledWith({ id: e.ROLE_MODERATOR }, expect.objectContaining({ SendMessages: null }));
    // roles that cannot be fetched are skipped
    const { guild } = guildOf({ roles: { everyone: { id: 'e' }, fetch: vi.fn(async () => null) } });
    const noRoles = lockChannel(false);
    await lockdown(slashStub({ channel: noRoles, guild }) as never);
    expect((noRoles.permissionOverwrites.edit as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
    const noRolesUnlock = lockChannel(true);
    await lockdown(slashStub({ channel: noRolesUnlock, guild }) as never);
    expect((noRolesUnlock.permissionOverwrites.edit as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
  });
});

describe('watchuser / unwatchuser', () => {
  it('watch needs a text alert channel and handles duplicates', async () => {
    const text = stubInstance<TextChannel>(TextChannel, { type: ChannelType.GuildText });
    const voice = { type: ChannelType.GuildVoice };
    expect(content((await run('watchuser', { target, notification_method: 'dm', alert_channel: voice })).stub)).toContain('text channel');
    mocks.watch.mockResolvedValueOnce(true);
    const ok = await run('watchuser', { target, notification_method: 'dm', alert_channel: text });
    expect(content(ok.stub)).toContain('notified when this user');
    expect(ok.log.send).toHaveBeenCalled();
    mocks.watch.mockResolvedValueOnce(false);
    expect(content((await run('watchuser', { target, notification_method: 'dm', alert_channel: text })).stub)).toContain('already watching');
  });

  it('watch defaults to the moderators channel', async () => {
    mocks.watch.mockResolvedValueOnce(true);
    const { stub } = await run('watchuser', { target, notification_method: 'channel' });
    expect(content(stub)).toContain('Done');
  });

  it('unwatch', async () => {
    mocks.deleteWatch.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    expect((await run('unwatchuser', { target })).result).toBe(true);
    expect(content((await run('unwatchuser', { target })).stub)).toContain('Whoops');
  });
});

describe('level freezes', () => {
  it('freeze handles ranges, errors and the nice level', async () => {
    mocks.setFreeze.mockRejectedValueOnce(new RangeError('bad'));
    expect(content((await run('freezelevel', { target, level: 500 })).stub)).toContain('between 1 and 100');
    mocks.setFreeze.mockRejectedValueOnce(new Error('db'));
    expect(content((await run('freezelevel', { target, level: 5 })).stub)).toContain('Something went wrong');
    mocks.setFreeze.mockResolvedValueOnce(undefined);
    const ok = await run('freezelevel', { target, level: 5 });
    expect(content(ok.stub)).toContain('frozen at 5.');
    mocks.setFreeze.mockResolvedValueOnce(undefined);
    const nice = await run('freezelevel', { target, level: mocks.niceLevel });
    expect(content(nice.stub)).toContain('Nice');
    expect(nice.log.send).toHaveBeenCalledWith(expect.stringContaining('Nice'));
  });

  it('unfreeze', async () => {
    mocks.removeFreeze.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    expect(content((await run('unfreezelevel', { target })).stub)).toContain("doesn't have");
    const ok = await run('unfreezelevel', { target });
    expect(content(ok.stub)).toContain('no longer frozen');
    expect(ok.log.send).toHaveBeenCalled();
  });

  it('lists frozen levels and paginates long lists', async () => {
    mocks.freezes.mockResolvedValueOnce([]);
    expect(content((await run('frozenlevels')).stub)).toContain('No users');
    mocks.totalLevel.mockResolvedValue(7);
    mocks.freezes.mockResolvedValueOnce([{ discordId: 'a', frozenLevel: 1 }]);
    const client = { users: { fetch: vi.fn().mockRejectedValue(new Error('gone')) } };
    const one = await run('frozenlevels', {}, { client });
    expect(content(one.stub)).toContain('unknown user');
    mocks.freezes.mockResolvedValueOnce(Array.from({ length: 80 }, (_, i) => ({ discordId: `${'9'.repeat(40)}${i}`, frozenLevel: i })));
    const many = await run('frozenlevels', {}, { client: { users: { fetch: vi.fn(async () => ({ username: 'x'.repeat(30) })) } } });
    expect(many.stub.followUp.mock.calls.length).toBeGreaterThan(0);
  });
});

describe('link', () => {
  it('links a thread or reports the existing one', async () => {
    mocks.link.mockResolvedValueOnce(null);
    const linked = await run('link', { target, override: true });
    expect(content(linked.stub)).toBe('Successfully linked thread!');
    expect(mocks.link).toHaveBeenCalledExactlyOnceWith(target.id, linked.stub.channelId, true);
    mocks.link.mockResolvedValueOnce('thread1');
    const client = { channels: { fetch: vi.fn(async () => 'THREAD') } };
    const clash = await run('link', { target }, { client });
    expect(content(clash.stub)).toContain('existing thread');
  });
});
