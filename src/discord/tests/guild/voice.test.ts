/* eslint-disable max-len, sonarjs/no-duplicate-string */
import { PermissionsBitField, TextChannel } from 'discord.js';
import { dVoice } from '../../commands/guild/d.voice';
import { lastReply, slashStub } from '../../../vitest/utils/commandStubs';
import { stubInstance } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({ bigBrother: vi.fn(), update: vi.fn() }));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/utils/thoughtPolice', () => ({ bigBrother: mocks.bigBrother }));
vi.mock('../../utils/tents', () => ({ levelRoles: { 5: 'r5', 10: 'r10', 20: 'r20' }, updateTentStatus: mocks.update }));

const e = env as unknown as Record<string, string>;
const F = PermissionsBitField.Flags;
const title = (s: ReturnType<typeof slashStub>) => (lastReply(s).embeds as Array<{ data: { title: string } }>)[0].data.title;

type Overwrite = { allow: { has: (p: bigint) => boolean }; deny: { has: (p: bigint) => boolean } };
const overwrite = (allow: bigint[] = [], deny: bigint[] = []): Overwrite => ({ allow: { has: p => allow.includes(p) }, deny: { has: p => deny.includes(p) } });

const tent = (over: Record<string, unknown> = {}) => {
  const overwrites = new Map<string, Overwrite>();
  const roles = new Map<string, unknown>([['r5', { id: 'r5' }], ['r10', { id: 'r10' }]]);
  return {
    name: '⛺│tent',
    permissionOverwrites: {
      cache: overwrites, edit: vi.fn(), delete: vi.fn(), create: vi.fn(),
    },
    permissionsFor: vi.fn(() => ({ has: () => true })),
    guild: { roles: { cache: roles, everyone: { id: 'everyone' } } },
    members: new Map([['m1', { id: 'm1' }]]),
    setName: vi.fn(),
    setUserLimit: vi.fn(),
    send: vi.fn(),
    overwrites,
    ...over,
  };
};

const memberIn = (channel: unknown, over: Record<string, unknown> = {}) => ({
  id: 'u1', displayName: 'Host', voice: { channel }, roles: { cache: new Set<string>() }, ...over,
});
const targetMember = (id = 't1', channel: unknown = null, over: Record<string, unknown> = {}) => ({
  id, displayName: `T-${id}`, user: { bot: false }, voice: { channel, setChannel: vi.fn() }, roles: { cache: new Set<string>() }, toString: (): string => `<@${id}>`, ...over,
});

const run = async (subcommand: string, channel: ReturnType<typeof tent> | null, options: Record<string, unknown> = {}, member: unknown = memberIn(channel)) => {
  const stub = slashStub({ subcommand, options, member });
  const result = await dVoice.execute(stub as never);
  return { stub, result };
};

describe('tent guards', () => {
  it('needs a voice channel, which for moderators can be the current text chat', async () => {
    const none = await run('lock', null);
    expect(none.result).toBe(false);
    expect(title(none.stub)).toBe('Error');
    const mod = memberIn(null, { roles: { cache: new Set([e.ROLE_MODERATOR]) } });
    const noChat = slashStub({ subcommand: 'lock', member: mod, channel: { isVoiceBased: () => false } });
    expect(await dVoice.execute(noChat as never)).toBe(false);
    const viaChat = slashStub({ subcommand: 'lock', member: mod, channel: { ...tent(), isVoiceBased: () => true } });
    expect(await dVoice.execute(viaChat as never)).toBe(true);
    const textChat = slashStub({ subcommand: 'lock', member: mod, channel: { isVoiceBased: () => false } });
    expect(await dVoice.execute(textChat as never)).toBe(false);
  });

  it('only works in tents, for hosts, and not on yourself or bots', async () => {
    expect((await run('lock', tent({ name: 'general' }))).result).toBe(false);
    expect((await run('lock', tent({ permissionsFor: () => ({ has: () => false }) }))).result).toBe(false);
    const c = tent();
    const me = memberIn(c);
    expect((await run('ban', c, { target: me }, me)).result).toBe(false);
    expect((await run('ban', c, { target: targetMember('b', null, { user: { bot: true } }) })).result).toBe(false);
  });
});

describe('tent name', () => {
  it('renames unless the name is flagged', async () => {
    const c = tent();
    mocks.bigBrother.mockResolvedValueOnce('clean');
    const ok = await run('name', c, { name: 'Chill' });
    expect(c.setName).toHaveBeenCalledWith('⛺│Chill');
    expect(title(ok.stub)).toBe('Tent renamed');
    mocks.bigBrother.mockResolvedValueOnce('offensive');
    const bad = await run('name', c, { name: 'bad' });
    expect(title(bad.stub)).toBe('Tent not renamed');
  });
});

describe('tent limit / level / lock', () => {
  it('limit sets and removes the cap', async () => {
    const c = tent();
    expect(title((await run('limit', c, { limit: 5 })).stub)).toBe('User limit set');
    expect(c.setUserLimit).toHaveBeenCalledWith(5);
    expect(title((await run('limit', c, { limit: 0 })).stub)).toBe('User limit removed');
    expect(mocks.update).toHaveBeenCalled();
  });

  it('level restricts lower roles or clears everything', async () => {
    const c = tent();
    expect(title((await run('level', c, { level: '10' })).stub)).toBe('Level requirement set');
    expect(c.permissionOverwrites.edit).toHaveBeenCalledWith({ id: 'r5' }, { Connect: false, ViewChannel: false });
    expect(c.permissionOverwrites.delete).toHaveBeenCalledWith({ id: 'r10' });
    const clear = tent();
    expect(title((await run('level', clear, { level: '0' })).stub)).toBe('Level requirement removed');
    expect(clear.permissionOverwrites.delete).toHaveBeenCalledTimes(2);
  });

  it('lock toggles based on whether everyone can currently connect', async () => {
    const open = tent({ permissionsFor: vi.fn(() => ({ has: (p: bigint) => p === F.Connect || p === F.MoveMembers })) });
    expect(title((await run('lock', open)).stub)).toBe('Locked');
    expect(open.permissionOverwrites.edit).toHaveBeenCalledWith({ id: 'everyone' }, { Connect: false });
    const locked = tent({ permissionsFor: vi.fn(() => ({ has: (p: bigint) => p === F.MoveMembers })) });
    expect(title((await run('lock', locked)).stub)).toBe('Unlocked');
  });
});

describe('tent host', () => {
  it('requires the new host to be in the tent, then transfers', async () => {
    const c = tent();
    const away = await run('host', c, { target: targetMember('t1', null) });
    expect(title(away.stub)).toBe('User not connected');
    const there = await run('host', c, { target: targetMember('t1', c) });
    expect(title(there.stub)).toBe('Host transferred');
    expect(c.permissionOverwrites.edit).toHaveBeenCalledWith('t1', { Connect: true, MoveMembers: true });
    expect(c.permissionOverwrites.edit).toHaveBeenCalledWith('u1', { Connect: true, MoveMembers: null });
    expect(c.setName).toHaveBeenCalledWith("⛺│T-t1's tent");
  });
});

describe('tent add / ban', () => {
  it('add un-bans, rejects moderators, adds, and removes', async () => {
    const c = tent();
    c.overwrites.set('t1', overwrite([], [F.ViewChannel]));
    expect(title((await run('add', c, { target: targetMember('t1') })).stub)).toBe('User unbanned and added');
    const mod = tent();
    expect(title((await run('add', mod, { target: targetMember('m', null, { roles: { cache: new Set([e.ROLE_MODERATOR]) } }) })).stub)).toBe('User is a moderator');
    const fresh = tent();
    expect(title((await run('add', fresh, { target: targetMember('t2') })).stub)).toBe('User added');
    expect(fresh.permissionOverwrites.create).toHaveBeenCalled();
    const existing = tent();
    existing.overwrites.set('t3', overwrite([F.Connect]));
    expect(title((await run('add', existing, { target: targetMember('t3') })).stub)).toBe('User un-added');
    expect(existing.permissionOverwrites.delete).toHaveBeenCalled();
  });

  it('ban handles moderators, existing bans, hosts and plain users', async () => {
    const mod = tent();
    expect(title((await run('ban', mod, { target: targetMember('m', null, { roles: { cache: new Set([e.ROLE_MODERATOR]) } }) })).stub)).toBe('User is a moderator');
    const banned = tent();
    banned.overwrites.set('t1', overwrite([], [F.ViewChannel]));
    expect(title((await run('ban', banned, { target: targetMember('t1') })).stub)).toBe('User unbanned');
    const host = tent();
    host.overwrites.set('t2', overwrite([F.MoveMembers]));
    const hostTarget = targetMember('t2');
    expect(title((await run('ban', host, { target: hostTarget })).stub)).toBe('User banned');
    expect(host.permissionOverwrites.edit).toHaveBeenCalledWith(hostTarget, { Connect: false, ViewChannel: false });
    expect(hostTarget.voice.setChannel).toHaveBeenCalledWith(null);
    const plain = tent();
    const plainTarget = targetMember('t3');
    expect(title((await run('ban', plain, { target: plainTarget })).stub)).toBe('User banned');
    expect(plain.permissionOverwrites.create).toHaveBeenCalled();
  });
});

describe('tent ping', () => {
  const lounge = () => stubInstance<TextChannel>(TextChannel, { send: vi.fn() });
  const withRoles = (c: ReturnType<typeof tent>) => { c.guild.roles.cache.set(e.ROLE_JOINVC, { id: 'joinvc' }); return c; };
  const pinger = (id: string, channel: unknown, loungeChannel: unknown) => memberIn(channel, { id, guild: { channels: { cache: new Map([[e.CHANNEL_LOUNGE, loungeChannel]]) } } });

  it('enforces the global and per-user cooldowns and reports missing pieces', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
      const noRole = tent();
      expect(title((await run('ping', noRole)).stub)).toBe('BAD ERROR');
      const c = withRoles(tent());
      const room = lounge();
      expect(title((await run('ping', c, {}, pinger('p1', c, room))).stub)).toBe('Ping sent');
      expect(room.send).toHaveBeenCalled();
      expect(title((await run('ping', c, {}, pinger('p1', c, room))).stub)).toBe('Cooldown');
      expect(title((await run('ping', c, {}, pinger('p2', c, room))).stub)).toBe('Cooldown');
      vi.setSystemTime(new Date('2030-01-01T01:30:00Z'));
      expect(title((await run('ping', c, {}, pinger('p3', c, { id: 'not-text' }))).stub)).toBe('BAD ERROR');
    } finally {
      vi.useRealTimers();
    }
  });
});
