/* eslint-disable no-void, sonarjs/no-duplicate-string, sonarjs/no-extra-arguments */
import { ChannelType, GuildPremiumTier, PermissionsBitField } from 'discord.js';
import { collectionOf, flushPromises } from '../../../vitest/utils/discordStubs';

const e = env as unknown as Record<string, string>;
const { Flags } = PermissionsBitField;

async function load() {
  vi.resetModules();
  return import('../../utils/tents');
}

const perm = (...flags: bigint[]) => new PermissionsBitField(flags);

type ChannelOpts = {
  id?: string; name?: string; open?: boolean; deniedRoles?: string[]; members?: Array<{ id: string; bot?: boolean; displayName?: string }>;
  overwrites?: Record<string, { allow?: bigint[]; deny?: bigint[] }>;
};

function tent(opts: ChannelOpts = {}) {
  const overwrites = new Map<string, { allow: PermissionsBitField; deny: PermissionsBitField }>();
  (opts.deniedRoles ?? []).forEach(role => overwrites.set(role, { allow: perm(), deny: perm(Flags.ViewChannel) }));
  Object.entries(opts.overwrites ?? {}).forEach(([id, o]) => overwrites.set(id, { allow: perm(...(o.allow ?? [])), deny: perm(...(o.deny ?? [])) }));
  const members = collectionOf((opts.members ?? []).map(m => [m.id, {
    id: m.id, displayName: m.displayName ?? m.id, user: { bot: !!m.bot }, toString: (): string => `<@${m.id}>`,
  }] as [string, object]));
  return {
    id: opts.id ?? 'c1',
    name: opts.name ?? '⛺│Ally\'s tent',
    type: ChannelType.GuildVoice,
    client: { rest: { put: vi.fn() } },
    guild: { roles: { everyone: { id: 'everyone' } } },
    permissionsFor: () => ({ has: () => opts.open !== false }),
    permissionOverwrites: { cache: overwrites, edit: vi.fn(), create: vi.fn() },
    members,
    send: vi.fn(),
    setName: vi.fn(),
    delete: vi.fn(),
    isVoiceBased: () => true,
  };
}

afterEach(() => vi.useRealTimers());

describe('tent levels and status line', () => {
  it('derives the level requirement from denied VIP roles', async () => {
    const { getTentLevel, getTentStatusLine, levelRoles } = await load();
    expect(getTentLevel(tent() as never)).toBe(0);
    expect(getTentLevel(tent({ deniedRoles: [levelRoles[0], levelRoles[10], levelRoles[20]] }) as never)).toBe(30);
    expect(getTentLevel(tent({ overwrites: { [levelRoles[10]]: { allow: [Flags.ViewChannel] } } }) as never)).toBe(0);
    expect(getTentStatusLine(tent() as never)).toBe('');
    expect(getTentStatusLine(tent({ open: false, deniedRoles: [levelRoles[0]] }) as never)).toBe('🔒 · 🎖️ 10+');
  });
});

describe('tent status updates', () => {
  it('ignores non-tent channels', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { updateTentStatus } = await load();
    const regular = tent({ name: 'lounge' });
    updateTentStatus(regular as never);
    await vi.advanceTimersByTimeAsync(3000);
    expect(regular.client.rest.put).not.toHaveBeenCalled();
  });

  it('debounces bursts into a single write', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { updateTentStatus } = await load();
    const c = tent({ open: false });
    updateTentStatus(c as never);
    updateTentStatus(c as never);
    await vi.advanceTimersByTimeAsync(2600);
    expect(c.client.rest.put).toHaveBeenCalledTimes(1);
    expect(c.client.rest.put).toHaveBeenCalledWith('/channels/c1/voice-status', { body: { status: '🔒' } });
  });

  it('survives REST failures', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { updateTentStatus } = await load();
    const c = tent();
    c.client.rest.put.mockRejectedValue(new Error('rate limited'));
    updateTentStatus(c as never);
    await vi.advanceTimersByTimeAsync(2600);
    expect(c.client.rest.put).toHaveBeenCalled();
  });
});

describe('registerTentStatusSync', () => {
  async function setup(channel: ReturnType<typeof tent> | undefined) {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const mod = await load();
    let handler: (packet: unknown) => void = () => undefined;
    mod.registerTentStatusSync({
      on: (_event: string, fn: (packet: unknown) => void) => { handler = fn; },
      channels: { cache: { get: () => channel } },
    } as never);
    return { handler: (packet: unknown) => handler(packet), channel };
  }
  const packet = (status: string | null, over: Record<string, unknown> = {}) => ({ t: 'VOICE_CHANNEL_STATUS_UPDATE', d: { id: 'c1', status }, ...over });

  it('re-applies member status text alongside the icons', async () => {
    const { handler, channel } = await setup(tent({ open: false }));
    handler(packet('movie night'));
    await vi.advanceTimersByTimeAsync(2600);
    expect(channel!.client.rest.put).toHaveBeenLastCalledWith('/channels/c1/voice-status', { body: { status: '🔒 | movie night' } });
  });

  it('keeps only the member portion when our icons are echoed back', async () => {
    const { handler, channel } = await setup(tent({ open: false }));
    handler(packet('🔒 | chill'));
    await vi.advanceTimersByTimeAsync(2600);
    expect(channel!.client.rest.put).toHaveBeenLastCalledWith('/channels/c1/voice-status', { body: { status: '🔒 | chill' } });
    handler(packet('🔒 · 🎖️ 30+ hello there'));
    await vi.advanceTimersByTimeAsync(2600);
    expect(channel!.client.rest.put).toHaveBeenCalledTimes(2);
  });

  it('strips our leading icon segments when the pipe is missing', async () => {
    const { handler, channel } = await setup(tent());
    handler(packet('🔒 · 🎖️ 20+ · plain text'));
    await vi.advanceTimersByTimeAsync(2600);
    expect(channel!.client.rest.put).toHaveBeenLastCalledWith('/channels/c1/voice-status', { body: { status: 'plain text' } });
  });

  it('ignores our own writes and unrelated packets', async () => {
    const { handler, channel } = await setup(tent());
    const { updateTentStatus } = await load();
    void updateTentStatus;
    handler({ t: 'OTHER', d: { id: 'c1' } });
    handler({ t: 'VOICE_CHANNEL_STATUS_UPDATE', d: {} });
    handler(packet(null));
    await vi.advanceTimersByTimeAsync(2600);
    expect(channel!.client.rest.put).not.toHaveBeenCalled();
  });

  it('ignores non-tent and non-voice channels', async () => {
    const lounge = await setup(tent({ name: 'lounge' }));
    lounge.handler(packet('x'));
    const text = tent();
    text.isVoiceBased = () => false;
    const nonVoice = await setup(text);
    nonVoice.handler(packet('x'));
    const missing = await setup(undefined);
    missing.handler(packet('x'));
    await vi.advanceTimersByTimeAsync(2600);
    expect(lounge.channel!.client.rest.put).not.toHaveBeenCalled();
    expect(text.client.rest.put).not.toHaveBeenCalled();
  });
});

describe('pitchTent', () => {
  function states(premiumTier: GuildPremiumTier | number = GuildPremiumTier.None, createFails = false) {
    const newChannel = {
      id: 'new1', fetch: vi.fn(), send: vi.fn(), name: '⛺│Ally\'s tent', client: { rest: { put: vi.fn() } }, guild: { roles: { everyone: { id: 'everyone' } } }, permissionsFor: () => ({ has: () => true }), permissionOverwrites: { cache: new Map() },
    };
    const setChannel = vi.fn();
    const create = createFails ? vi.fn().mockRejectedValue(new Error('Missing Permissions')) : vi.fn(async () => newChannel);
    const member = {
      id: 'm1', displayName: 'Ally', voice: { setChannel }, guild: { premiumTier, roles: { everyone: { id: 'everyone' } }, channels: { create } },
    };
    return {
      Old: {} as never, New: { member } as never, create, setChannel, newChannel,
    };
  }

  it('creates a tent for the caller, moves them in and posts the help card', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { pitchTent } = await load();
    const {
      Old, New, create, setChannel, newChannel,
    } = states();
    await pitchTent(Old, New);
    await flushPromises();
    const [options] = create.mock.calls[0] as unknown as [{ name: string; bitrate: number; userLimit: number; parent: string }];
    expect(options).toMatchObject({
      name: "⛺│Ally's tent", bitrate: 96000, userLimit: 8, parent: e.CATEGORY_VOICE,
    });
    expect(setChannel).toHaveBeenCalledWith('new1');
    expect(newChannel.send).toHaveBeenCalledWith(expect.objectContaining({ flags: 32768 }));
  });

  it.each([
    [GuildPremiumTier.Tier1, 128000], [GuildPremiumTier.Tier2, 256000], [GuildPremiumTier.Tier3, 384000], [99, 64000],
  ])('uses the best bitrate for tier %s', async (tier, bitrate) => {
    const { pitchTent } = await load();
    const { Old, New, create } = states(tier);
    await pitchTent(Old, New);
    expect((create.mock.calls[0] as unknown as [{ bitrate: number }])[0].bitrate).toBe(bitrate);
    await flushPromises();
  });

  it('logs failures instead of throwing', async () => {
    const { pitchTent } = await load();
    const { Old, New } = states(GuildPremiumTier.None, true);
    await expect(pitchTent(Old, New)).resolves.toBeUndefined();
    await flushPromises();
  });
});

describe('teardownTent', () => {
  function category(channels: ReturnType<typeof tent>[]) {
    return { children: { cache: collectionOf(channels.map(c => [c.id, c] as [string, ReturnType<typeof tent>])) } };
  }
  const oldState = (cat: unknown, fetchFails = false) => ({
    guild: { channels: { fetch: vi.fn(async (id: string) => { if (id !== e.CATEGORY_VOICE && fetchFails) throw new Error('gone'); return cat; }) } },
  }) as never;

  it('deletes empty tents only', async () => {
    const { teardownTent } = await load();
    const empty = tent({ id: 'a', members: [] });
    const botsOnly = tent({ id: 'b', members: [{ id: 'bot', bot: true }] });
    const occupied = tent({ id: 'c', members: [{ id: 'h1' }] });
    const regular = tent({ id: 'd', name: 'lounge', members: [] });
    await teardownTent(oldState(category([empty, botsOnly, occupied, regular])));
    expect(empty.delete).toHaveBeenCalledWith('Removing temporary voice chan!');
    expect(botsOnly.delete).toHaveBeenCalled();
    expect(occupied.delete).not.toHaveBeenCalled();
    expect(regular.delete).not.toHaveBeenCalled();
  });

  it('tolerates channels that vanished during teardown', async () => {
    const { teardownTent } = await load();
    const gone = tent({ id: 'a', members: [] });
    await expect(teardownTent(oldState(category([gone]), true))).resolves.toBeUndefined();
    expect(gone.delete).not.toHaveBeenCalled();
  });

  it('cancels pending host transfers and status updates for deleted tents', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const { teardownTent, logTent, updateTentStatus } = await load();
    const host = { id: 'h1', displayName: 'Host', toString: (): string => '<@h1>' };
    const c = tent({ id: 'a', members: [{ id: 'other' }], overwrites: { h1: { allow: [Flags.MoveMembers] } } });
    await logTent({ channel: c, member: host } as never, { channel: null } as never);
    updateTentStatus(c as never);
    c.members.clear();
    await teardownTent(oldState(category([c])));
    await vi.advanceTimersByTimeAsync(400000);
    expect(c.permissionOverwrites.create).not.toHaveBeenCalled();
    expect(c.client.rest.put).not.toHaveBeenCalled();
  });
});

describe('transferTent', () => {
  it('promotes the first remaining member and renames the tent', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { transferTent } = await load();
    const c = tent({ members: [{ id: 'n1', displayName: 'Newbie' }] });
    await transferTent(c as never, { id: 'old' } as never);
    expect(c.send).toHaveBeenCalledWith(expect.objectContaining({ content: '<@n1>' }));
    expect(c.permissionOverwrites.edit).toHaveBeenCalledWith('old', { MoveMembers: null });
    expect(c.permissionOverwrites.create).toHaveBeenCalledWith('n1', { Connect: true, MoveMembers: true });
    expect(c.setName).toHaveBeenCalledWith("⛺│Newbie's tent");
  });

  it('copes with an empty tent or unknown old host', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { transferTent } = await load();
    const c = tent({ members: [] });
    await transferTent(c as never, undefined as never);
    expect(c.send).not.toHaveBeenCalled();
    expect(c.setName).not.toHaveBeenCalled();
  });
});

describe('logTent', () => {
  const user = (id: string) => ({ id, displayName: id, toString: (): string => `<@${id}>` });
  const description = (send: ReturnType<typeof vi.fn>) => (send.mock.calls.at(-1)?.[0] as { embeds: Array<{ data: { description: string } }> }).embeds[0].data.description;

  it('announces non-host members leaving and joining', async () => {
    const { logTent } = await load();
    const c = tent({ members: [{ id: 'x' }] });
    await logTent({ channel: c, member: user('guest') } as never, { channel: null } as never);
    expect(description(c.send)).toContain('<@guest> left the tent.');
    await logTent({ channel: null } as never, { channel: c, member: user('guest') } as never);
    expect(description(c.send)).toContain('<@guest> joined the tent.');
  });

  it('ignores non-tent channels and last-member departures', async () => {
    const { logTent } = await load();
    const lounge = tent({ name: 'lounge', members: [{ id: 'x' }] });
    await logTent({ channel: lounge, member: user('a') } as never, { channel: lounge, member: user('a') } as never);
    const emptied = tent({ members: [] });
    await logTent({ channel: emptied, member: user('a') } as never, { channel: null } as never);
    expect(lounge.send).not.toHaveBeenCalled();
    expect(emptied.send).not.toHaveBeenCalled();
  });

  it('starts a five minute host transfer when the host leaves, and cancels it on return', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const { logTent } = await load();
    const c = tent({ members: [{ id: 'friend', displayName: 'Friend' }], overwrites: { host: { allow: [Flags.MoveMembers] } } });
    await logTent({ channel: c, member: user('host') } as never, { channel: null } as never);
    expect(description(c.send)).toContain('The host, <@host> left!');
    await logTent({ channel: null } as never, { channel: c, member: user('host') } as never);
    expect(description(c.send)).toContain('has rejoined');
    await vi.advanceTimersByTimeAsync(400000);
    expect(c.permissionOverwrites.create).not.toHaveBeenCalled();
  });

  it('transfers the tent when the host does not return in time', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const { logTent } = await load();
    const c = tent({ members: [{ id: 'friend', displayName: 'Friend' }], overwrites: { host: { allow: [Flags.MoveMembers] } } });
    await logTent({ channel: c, member: user('host') } as never, { channel: null } as never);
    await vi.advanceTimersByTimeAsync(300001);
    expect(c.permissionOverwrites.create).toHaveBeenCalledWith('friend', { Connect: true, MoveMembers: true });
  });

  it('stays quiet when the host joins with no transfer pending', async () => {
    const { logTent } = await load();
    const c = tent({ overwrites: { host: { allow: [Flags.MoveMembers] } } });
    await logTent({ channel: null } as never, { channel: c, member: user('host') } as never);
    expect(c.send).not.toHaveBeenCalled();
  });
});
