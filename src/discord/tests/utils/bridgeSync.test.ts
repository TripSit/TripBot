import { ChannelType, PermissionFlagsBits } from 'discord.js';
import type { Client, Guild } from 'discord.js';
import { candidateChannels, isPrivateChannel, registerBridgeSync } from '../../utils/bridgeSync';
import { collectionOf } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({
  syncChannels: vi.fn(), logSync: vi.fn(), getRows: vi.fn(), unresolved: vi.fn(), describe: vi.fn(),
}));

vi.mock('../../../global/bridge/bridge.mappings', () => ({
  syncChannels: mocks.syncChannels,
  logSyncSummary: mocks.logSync,
  getMappingRows: mocks.getRows,
  unresolvedSeeds: mocks.unresolved,
}));
vi.mock('../../../global/bridge/bridge.channels', () => ({ describeChannels: mocks.describe }));

const e = env as unknown as Record<string, unknown>;

const channel = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  name: `name-${id}`,
  topic: 't',
  parentId: 'cat',
  type: ChannelType.GuildText,
  guildId: 'main',
  guild: { id: 'main' },
  permissionOverwrites: { cache: new Map<string, { deny: { has:(flag: bigint) => boolean } }>() },
  ...over,
});

const guildOf = (channels: ReturnType<typeof channel>[]) => ({
  channels: { cache: collectionOf(channels.map(c => [c.id, c] as [string, unknown])) },
}) as unknown as Guild;

const flush = () => new Promise<void>(resolve => { setImmediate(resolve); });

describe('isPrivateChannel', () => {
  it('is private when @everyone is denied ViewChannel', () => {
    const hidden = channel('a');
    hidden.permissionOverwrites.cache.set('main', { deny: { has: flag => flag === PermissionFlagsBits.ViewChannel } });
    expect(isPrivateChannel(hidden as never)).toBe(true);
  });

  it('is public with no overwrite or a different denial', () => {
    expect(isPrivateChannel(channel('a') as never)).toBe(false);
    const other = channel('b');
    other.permissionOverwrites.cache.set('main', { deny: { has: () => false } });
    expect(isPrivateChannel(other as never)).toBe(false);
  });
});

describe('candidateChannels', () => {
  it('keeps text and announcement channels and describes them', () => {
    const result = candidateChannels(guildOf([
      channel('1'), channel('2', { type: ChannelType.GuildAnnouncement }), channel('3', { type: ChannelType.GuildVoice }),
    ]));
    expect(result.map(c => c.id)).toEqual(['1', '2']);
    expect(result[0]).toEqual({
      id: '1', name: 'name-1', topic: 't', parentId: 'cat', isPrivate: false,
    });
  });
});

describe('registerBridgeSync', () => {
  beforeEach(() => {
    e.DISCORD_GUILD_ID = 'main';
    e.BRIDGE_SYNC_DRY_RUN = false;
    mocks.syncChannels.mockResolvedValue({ create: [] });
    mocks.getRows.mockReturnValue([]);
    mocks.unresolved.mockReturnValue(['Seed (#irc, env KEY)']);
    mocks.describe.mockReturnValue(['line one']);
  });

  function setup(cached = true) {
    const handlers: Record<string, (...args: unknown[]) => void> = {};
    const client = {
      once: vi.fn((event: string, fn: () => void) => { handlers[event] = fn; }),
      on: vi.fn((event: string, fn: () => void) => { handlers[event] = fn; }),
      guilds: { cache: new Map(cached ? [['main', guildOf([channel('1')])]] : []) },
    } as unknown as Client;
    registerBridgeSync(client);
    return handlers;
  }

  async function loadFresh() {
    vi.resetModules();
    return import('../../utils/bridgeSync');
  }

  it('syncs when the client is ready, and reports only on the first sync', async () => {
    const { registerBridgeSync: register } = await loadFresh();
    const handlers: Record<string, (...args: unknown[]) => void> = {};
    const client = {
      once: (event: string, fn: () => void) => { handlers[event] = fn; },
      on: (event: string, fn: () => void) => { handlers[event] = fn; },
      guilds: { cache: new Map([['main', guildOf([channel('1')])]]) },
    } as unknown as Client;
    register(client);
    handlers.clientReady();
    handlers.channelCreate(channel('2'));
    await flush();
    await flush();
    expect(mocks.syncChannels).toHaveBeenCalledTimes(2);
    expect(mocks.logSync).toHaveBeenCalledTimes(1);
    expect(mocks.describe).toHaveBeenCalledTimes(1);
  });

  it('includes would-be rows in the report during a dry run', async () => {
    e.BRIDGE_SYNC_DRY_RUN = true;
    mocks.syncChannels.mockResolvedValue({ create: [{ irc_channel: '#new' }] });
    const { syncBridgeChannels } = await loadFresh();
    await syncBridgeChannels({ guilds: { cache: new Map([['main', guildOf([])]]) } } as unknown as Client);
    const rows = mocks.describe.mock.calls[0][0];
    expect(rows).toEqual([expect.objectContaining({ irc_channel: '#new', active: true, enabled: true })]);
  });

  it('skips the sync when the main guild is not cached', async () => {
    const { syncBridgeChannels } = await loadFresh();
    await syncBridgeChannels({ guilds: { cache: new Map() } } as unknown as Client);
    expect(mocks.syncChannels).not.toHaveBeenCalled();
  });

  it('logs and carries on when a sync fails', async () => {
    mocks.syncChannels.mockRejectedValueOnce(new Error('db down'));
    const { syncBridgeChannels } = await loadFresh();
    const client = { guilds: { cache: new Map([['main', guildOf([])]]) } } as unknown as Client;
    await expect(syncBridgeChannels(client)).resolves.toBeUndefined();
    mocks.syncChannels.mockResolvedValue({ create: [] });
    await syncBridgeChannels(client);
    expect(mocks.syncChannels).toHaveBeenCalledTimes(2);
  });

  it('reacts to channel changes only in the main guild', async () => {
    const handlers = setup();
    mocks.syncChannels.mockClear();
    handlers.channelCreate({ guildId: 'other' });
    handlers.channelUpdate({}, { guildId: 'other' });
    handlers.channelDelete({ guildId: 'other' });
    handlers.channelUpdate({}, {});
    handlers.channelDelete({});
    await flush();
    expect(mocks.syncChannels).not.toHaveBeenCalled();

    handlers.channelUpdate({}, { guildId: 'main' });
    handlers.channelDelete({ guildId: 'main' });
    handlers.channelCreate({ guildId: 'main' });
    await flush();
    await flush();
    expect(mocks.syncChannels).toHaveBeenCalledTimes(3);
  });
});
