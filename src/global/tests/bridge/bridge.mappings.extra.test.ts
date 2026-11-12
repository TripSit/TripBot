import { dbMock } from '../../../vitest/utils/mockDb';
import { mappingRow } from '../../../vitest/utils/bridgeMappings';
import { bridgeGatewaySeeds } from '../../bridge/bridge.gateways';
import type { SyncPlan } from '../../bridge/bridge.channels';
import {
  applySyncPlan, getGateways, getIrcChannelLength, getMappingRows, initBridgeMappings, logSyncSummary,
  markIrcRegistered, onMappingChange, setIrcChannelLength, setMappings, syncChannels, unresolvedSeeds,
} from '../../bridge/bridge.mappings';

const originalEnv = { ...env };

beforeEach(() => {
  setMappings([]);
  bridgeGatewaySeeds.forEach(seed => { env[seed.discord] = ''; });
  dbMock.bridge_channels.findMany.mockResolvedValue([]);
  vi.spyOn(global.log, 'info').mockReturnValue(undefined as never);
  vi.spyOn(global.log, 'warn').mockReturnValue(undefined as never);
});

afterEach(() => {
  Object.assign(env, originalEnv);
  vi.restoreAllMocks();
});

const emptyPlan = (over: Partial<SyncPlan> = {}): SyncPlan => ({
  create: [],
  activate: [],
  deactivate: [],
  topics: [],
  messages: [],
  stats: {
    bridged: 0, skippedPrivate: 0, skippedCategory: 0, collisions: 0, unnamed: 0,
  },
  ...over,
} as SyncPlan);

describe('irc channel length', () => {
  it('stores what the server reports', () => {
    setIrcChannelLength(50);
    expect(getIrcChannelLength()).toBe(50);
    setIrcChannelLength(undefined);
    expect(getIrcChannelLength()).toBeUndefined();
  });
});

describe('unresolvedSeeds', () => {
  it('lists the seeds that have no Discord channel in this environment', () => {
    const first = bridgeGatewaySeeds[0];
    env[first.discord] = 'some-id';
    const unresolved = unresolvedSeeds();
    expect(unresolved).toHaveLength(bridgeGatewaySeeds.length - 1);
    expect(unresolved.some(line => line.includes(first.irc))).toBe(false);
  });
});

describe('mapping change notifications', () => {
  it('reports joins, parts and topic changes, and stops after unsubscribe', () => {
    const listener = vi.fn();
    const off = onMappingChange(listener);
    setMappings([mappingRow({ irc_channel: '#a', topic: 'old' }), mappingRow({ irc_channel: '#b' })]);
    expect(listener).toHaveBeenLastCalledWith({ added: ['#a', '#b'], removed: [], topics: [] });

    setMappings([mappingRow({ irc_channel: '#a', topic: 'new' }), mappingRow({ irc_channel: '#c' })]);
    expect(listener).toHaveBeenLastCalledWith({ added: ['#c'], removed: ['#b'], topics: ['#a'] });

    off();
    setMappings([]);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('treats inactive or disabled rows as not bridged', () => {
    setMappings([mappingRow({ active: false }), mappingRow({ irc_channel: '#off', enabled: false })]);
    expect(getGateways()).toEqual([]);
    expect(getMappingRows()).toHaveLength(2);
  });
});

describe('getGateways', () => {
  it('maps rows to gateways sorted by IRC channel, with optional matrix rooms', () => {
    setMappings([
      mappingRow({ irc_channel: '#zeta', gateway_name: 'Zeta', matrix_room_id: '!z:x' }),
      mappingRow({ irc_channel: '#alpha', gateway_name: 'Alpha' }),
    ]);
    expect(getGateways()).toEqual([
      {
        name: 'Alpha', discord: 'discord-lounge', irc: '#alpha', matrix: undefined,
      },
      {
        name: 'Zeta', discord: 'discord-lounge', irc: '#zeta', matrix: '!z:x',
      },
    ]);
  });
});

describe('initBridgeMappings matrix updates', () => {
  it('copies matrix room ids onto existing rows', async () => {
    const seed = bridgeGatewaySeeds.find(candidate => candidate.matrix);
    if (!seed) return;
    env[seed.discord] = 'seed-channel';
    dbMock.bridge_channels.findMany.mockResolvedValue([
      mappingRow({ discord_channel_id: 'seed-channel', irc_channel: seed.irc.toLowerCase(), matrix_room_id: null }),
    ] as never);
    await initBridgeMappings();
    expect(dbMock.bridge_channels.update).toHaveBeenCalledWith({
      where: { irc_channel: seed.irc.toLowerCase() }, data: { matrix_room_id: seed.matrix },
    });
  });
});

describe('applySyncPlan', () => {
  it('writes only the parts of the plan that have changes', async () => {
    await applySyncPlan(emptyPlan());
    expect(dbMock.$transaction).toHaveBeenCalledWith([]);
  });

  it('creates, activates, deactivates and updates topics in one transaction', async () => {
    const create = [{ irc_channel: '#new' }] as never;
    await applySyncPlan(emptyPlan({
      create,
      activate: [mappingRow({ irc_channel: '#on' })],
      deactivate: [mappingRow({ irc_channel: '#off' })],
      topics: [{ irc_channel: '#a', topic: 'hello' }, { irc_channel: '#b', topic: 'world' }] as never,
    }));
    expect(dbMock.bridge_channels.createMany).toHaveBeenCalledWith({ data: create, skipDuplicates: true });
    expect(dbMock.bridge_channels.updateMany).toHaveBeenCalledWith({
      where: { irc_channel: { in: ['#on'] } }, data: { active: true },
    });
    expect(dbMock.bridge_channels.updateMany).toHaveBeenCalledWith({
      where: { irc_channel: { in: ['#off'] } }, data: { active: false },
    });
    expect(dbMock.bridge_channels.updateMany).toHaveBeenCalledWith({
      where: { irc_channel: '#a' }, data: { topic: 'hello' },
    });
    expect(dbMock.bridge_channels.updateMany).toHaveBeenCalledTimes(4);
  });
});

describe('markIrcRegistered', () => {
  it('persists the flag and updates the cache case-insensitively', async () => {
    setMappings([mappingRow({ irc_channel: '#lounge', irc_registered: false }), mappingRow({ irc_channel: '#other', irc_registered: false })]);
    await markIrcRegistered('#Lounge');
    expect(dbMock.bridge_channels.updateMany).toHaveBeenCalledWith({
      where: { irc_channel: '#lounge' }, data: { irc_registered: true },
    });
    expect(getMappingRows().map(row => row.irc_registered)).toEqual([true, false]);
  });
});

describe('logSyncSummary', () => {
  it('summarises the plan, noting dry runs and unnamed channels', () => {
    const info = vi.mocked(global.log.info);
    logSyncSummary(emptyPlan(), true);
    expect(info.mock.calls.at(-1)?.[1]).toContain('(dry run)');
    logSyncSummary(emptyPlan({
      stats: {
        bridged: 2, skippedPrivate: 1, skippedCategory: 0, collisions: 0, unnamed: 3,
      },
    }), false);
    expect(info.mock.calls.at(-1)?.[1]).toContain('2 bridged');
    expect(info.mock.calls.at(-1)?.[1]).toContain('3 without a usable name');
  });
});

describe('syncChannels', () => {
  it('only reloads the cache when nothing changed', async () => {
    await syncChannels([]);
    expect(dbMock.$transaction).not.toHaveBeenCalled();
    expect(dbMock.bridge_channels.findMany).toHaveBeenCalledTimes(2);
  });

  it('plans without writing during a dry run', async () => {
    const [category] = Object.keys(env.BRIDGE_CATEGORIES);
    const plan = await syncChannels(
      [{
        id: '9', name: 'food', topic: null, parentId: category, isPrivate: false,
      }],
      { dryRun: true },
    );
    expect(plan.create.length).toBeGreaterThan(0);
    expect(dbMock.$transaction).not.toHaveBeenCalled();
  });
});
