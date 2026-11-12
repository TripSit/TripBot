import { Guild, RateLimitError } from 'discord.js';
import {
  checkChannelPermissions, checkGuildPermissions, ensurePermissions, missingPermission,
  TRIPSIT_CHANNEL_PERMS, tripsitChannelOwnerMessage,
} from '../../utils/checkPermissions';
import {
  isQueuedTicketRename, modTicketIcons, retagModTicketChannelName, retagTicketChannelName, setModTicketChannelName,
  setTicketChannelName, ticketIcons,
} from '../../utils/ticketIcons';
import { stubInstance } from '../../../vitest/utils/discordStubs';
import * as roleGroups from '../../utils/roleGroups';

const perm = (...names: string[]) => names as never;
const perms = (granted: string[]) => ({ has: (p: string) => granted.includes(p) });

function guildStub(granted: string[], owner: { send: ReturnType<typeof vi.fn> } | Error = { send: vi.fn() }) {
  const guild = stubInstance<Guild>(Guild, {
    id: 'g1',
    toString: (): string => 'GuildName',
    fetchOwner: owner instanceof Error ? vi.fn().mockRejectedValue(owner) : vi.fn(async () => owner),
  });
  (global as unknown as { discordClient: unknown }).discordClient = {
    user: { id: 'bot' },
    guilds: { fetch: vi.fn(async () => ({ members: { fetch: vi.fn(async () => ({ permissions: perms(granted) })) } })) },
  };
  return guild;
}

function channelStub(granted: string[], owner: { send: ReturnType<typeof vi.fn> } | Error = { send: vi.fn() }) {
  return {
    toString: (): string => '<#chan>',
    guild: {
      toString: (): string => 'GuildName',
      members: { me: { id: 'bot' } },
      fetchOwner: owner instanceof Error ? vi.fn().mockRejectedValue(owner) : vi.fn(async () => owner),
    },
    permissionsFor: vi.fn(() => perms(granted)),
  };
}

describe('checkGuildPermissions', () => {
  it('passes when the bot has everything and names the first missing permission otherwise', async () => {
    const guild = guildStub(perm('A', 'B'));
    expect(await checkGuildPermissions(guild, perm('A', 'B'))).toEqual({ hasPermission: true });
    expect(await checkGuildPermissions(guild, perm('A', 'C', 'D'))).toEqual({ hasPermission: false, permission: 'C' });
  });
});

describe('checkChannelPermissions', () => {
  it('checks the bot member\'s channel permissions', async () => {
    const channel = channelStub(perm('A'));
    expect(await checkChannelPermissions(channel as never, perm('A'))).toEqual({ hasPermission: true });
    expect(await checkChannelPermissions(channel as never, perm('A', 'B'))).toEqual({ hasPermission: false, permission: 'B' });
  });
});

describe('missingPermission', () => {
  it('uses guild checks for guilds and channel checks for channels', async () => {
    expect(await missingPermission(guildStub(perm('A')), perm('A'))).toBeNull();
    expect(await missingPermission(guildStub([]), perm('A'))).toBe('A');
    expect(await missingPermission(channelStub(perm('A')) as never, perm('A'))).toBeNull();
    expect(await missingPermission(channelStub([]) as never, perm('B'))).toBe('B');
  });
});

describe('ensurePermissions', () => {
  it('returns true without bothering anyone when nothing is missing', async () => {
    const owner = { send: vi.fn() };
    expect(await ensurePermissions(channelStub(perm('A'), owner) as never, perm('A'), 'F')).toBe(true);
    expect(owner.send).not.toHaveBeenCalled();
  });

  it('DMs the owner with the default reason', async () => {
    const owner = { send: vi.fn() };
    expect(await ensurePermissions(channelStub([], owner) as never, perm('A'), 'caller')).toBe(false);
    expect(owner.send).toHaveBeenCalledWith({ content: 'Please make sure I can A in <#chan> so I can run caller!' });
  });

  it('supports custom reasons and fully custom owner messages, on guilds too', async () => {
    const owner = { send: vi.fn() };
    await ensurePermissions(guildStub([], owner), perm('X'), 'F', { reason: 'do things' });
    expect(owner.send).toHaveBeenCalledWith({ content: expect.stringContaining('so I can do things!') });
    await ensurePermissions(guildStub([], owner), perm('X'), 'F', { ownerMessage: missing => `need ${String(missing)}` });
    expect(owner.send).toHaveBeenLastCalledWith({ content: 'need X' });
  });

  it('still returns false when the owner cannot be DMed', async () => {
    expect(await ensurePermissions(channelStub([], new Error('DMs closed')) as never, perm('A'), 'F')).toBe(false);
  });
});

describe('tripsit permission copy', () => {
  it('lists the required permissions and mentions bot-requested threads for the meta channel', () => {
    expect(TRIPSIT_CHANNEL_PERMS).toContain('ManageThreads');
    expect(tripsitChannelOwnerMessage({ toString: (): string => '#c' } as never, false)).not.toContain('when requested');
    expect(tripsitChannelOwnerMessage({ toString: (): string => '#c' } as never, true)).toContain('when requested through the bot');
  });
});

describe('roleGroups', () => {
  it('derives VIP lookups from the level table', () => {
    expect(Object.keys(roleGroups.VIP_ROLES_BY_LEVEL)).toHaveLength(11);
    expect(roleGroups.vipRolesAtOrAbove(100)).toEqual([env.ROLE_VIP_100]);
    expect(roleGroups.vipRolesAtOrAbove(0)).toHaveLength(11);
    expect(roleGroups.vipRolesAtOrAbove(95)).toEqual([env.ROLE_VIP_100]);
  });

  it('builds the combined groups from their parts', () => {
    expect(Object.keys(roleGroups.MINDSET_ROLES)).toHaveLength(
      Object.keys(roleGroups.CORE_MINDSET_ROLES).length + Object.keys(roleGroups.STATUS_MINDSET_ROLES).length
      + Object.keys(roleGroups.EVENT_MINDSET_ROLES).length,
    );
    expect(roleGroups.TRIPSITME_COLOR_ROLES).toHaveLength(
      roleGroups.LEGACY_COLOR_ROLES.length + 1 + Object.keys(roleGroups.LEVEL_COLOR_ROLES).length
      + Object.keys(roleGroups.DONOR_COLOR_ROLES).length,
    );
    expect(roleGroups.TRIPSITME_MINDSET_ROLES).toHaveLength(
      Object.keys(roleGroups.CORE_MINDSET_ROLES).length + Object.keys(roleGroups.EVENT_MINDSET_ROLES).length,
    );
    expect(roleGroups.SUPPORTER_ROLES).toEqual(roleGroups.TRIPSITME_OTHER_ROLES);
    expect(Object.keys(roleGroups.TTS_MINDSET_ROLES).length).toBeGreaterThan(0);
    expect(roleGroups.TEAM_ROLES.length).toBeGreaterThan(5);
  });
});

describe('ticket icon names', () => {
  it('swaps the icon prefix and keeps the rest of the name', () => {
    expect(retagTicketChannelName('🟡 ▲│alice', 'closed')).toBe(`${ticketIcons.closed}│alice`);
    expect(retagTicketChannelName('plainname', 'new')).toBe(`${ticketIcons.new}│plainname`);
    expect(retagModTicketChannelName('x│bob', 'closedByMod')).toBe(`${modTicketIcons.closedByMod}│bob`);
  });
});

describe('ticket channel renames', () => {
  const flush = () => new Promise<void>(resolve => { setImmediate(resolve); });

  function channelOf(id: string, current: Record<string, unknown>) {
    const live = {
      name: 'old',
      isDMBased: () => false,
      isThread: () => false,
      archived: false,
      setName: vi.fn(),
      edit: vi.fn(),
      setArchived: vi.fn(),
      ...current,
    };
    const client = { channels: { fetch: vi.fn(async () => live) } };
    return { target: { id, client } as never, live, client };
  }

  it('renames channels whose name differs', async () => {
    const { target, live } = channelOf('rename-1', {});
    await setTicketChannelName(target, 'new');
    expect(live.setName).toHaveBeenCalledWith('new');
    expect(isQueuedTicketRename('rename-1')).toBe(false);
  });

  it('leaves channels alone that already have the name, or are DMs', async () => {
    const same = channelOf('rename-2', { name: 'new' });
    await setModTicketChannelName(same.target, 'new');
    expect(same.live.setName).not.toHaveBeenCalled();
    const dm = channelOf('rename-3', { isDMBased: () => true });
    await setModTicketChannelName(dm.target, 'new');
    expect(dm.live.setName).not.toHaveBeenCalled();
  });

  it('unarchives archived threads to rename them, then archives them again', async () => {
    const { target, live } = channelOf('rename-4', { isThread: () => true, archived: true });
    await setTicketChannelName(target, 'new');
    expect(live.edit).toHaveBeenCalledWith({ name: 'new', archived: false });
    expect(live.setArchived).toHaveBeenCalledWith(true);
  });

  it('swallows rename failures', async () => {
    const { target, live } = channelOf('rename-5', {});
    live.setName.mockRejectedValue(new Error('Missing Permissions'));
    await expect(setTicketChannelName(target, 'new')).resolves.toBeUndefined();
    expect(isQueuedTicketRename('rename-5')).toBe(false);
  });

  it('retries after Discord rate limits', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    try {
      const { target, live } = channelOf('rename-6', {});
      live.setName.mockRejectedValueOnce(stubInstance(RateLimitError, { sublimitTimeout: 0, retryAfter: 2500 }));
      await setTicketChannelName(target, 'new');
      expect(isQueuedTicketRename('rename-6')).toBe(true);
      await vi.advanceTimersByTimeAsync(2500);
      await flush();
      expect(live.setName).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('applies the latest wanted name when renames overlap', async () => {
    const { target, live } = channelOf('rename-7', {});
    let release!: () => void;
    live.setName.mockImplementationOnce(() => new Promise<void>(resolve => { release = resolve; }));
    const first = setTicketChannelName(target, 'first');
    await flush();
    await setTicketChannelName(target, 'second');
    release();
    await first;
    expect(live.setName).toHaveBeenLastCalledWith('second');
  });
});
