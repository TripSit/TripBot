import { bridgeGatewaySeeds } from '../../bridge/bridge.gateways';
import { dbMock } from '../../../vitest/utils/mockDb';
import { mappingRow } from '../../../vitest/utils/bridgeMappings';
import {
  getGateways, initBridgeMappings, onMappingChange, setMappings, syncChannels,
} from '../../bridge/bridge.mappings';

const originalEnv = { ...env };

beforeEach(() => {
  setMappings([]);
  // Only the keys a test sets are bridged in its environment
  bridgeGatewaySeeds.forEach(seed => { env[seed.discord] = ''; });
  vi.spyOn(global.log, 'info').mockReturnValue(undefined as never);
  vi.spyOn(global.log, 'warn').mockReturnValue(undefined as never);
  dbMock.bridge_channels.findMany.mockResolvedValue([]);
});

afterEach(() => {
  Object.assign(env, originalEnv);
  vi.restoreAllMocks();
});

describe('initBridgeMappings', () => {
  it('seeds the hand-written gateways for this environment and loads the table', async () => {
    env.CHANNEL_LOUNGE = 'lounge-id';
    env.CHANNEL_OPIATES = 'opiates-id';
    dbMock.bridge_channels.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        mappingRow({ discord_channel_id: 'opiates-id', irc_channel: '#opiates', gateway_name: 'Opioids' }),
      ] as never);

    await initBridgeMappings();

    const { data } = dbMock.bridge_channels.createMany.mock.calls[0][0] as { data: { irc_channel: string }[] };
    expect(data.map(row => row.irc_channel)).toEqual(expect.arrayContaining(['#lounge', '#opiates']));
    expect(data.every(row => row.irc_channel === row.irc_channel.toLowerCase())).toBe(true);
    // Discord renames never matter: #opiates stays #opiates
    expect(getGateways().map(gateway => gateway.irc)).toEqual(['#opiates']);
  });

  it('does not write anything when everything is already seeded', async () => {
    env.CHANNEL_LOUNGE = 'lounge-id';
    dbMock.bridge_channels.findMany.mockResolvedValue([
      mappingRow({ discord_channel_id: 'lounge-id', irc_channel: '#lounge' }),
    ] as never);
    await initBridgeMappings();
    expect(dbMock.bridge_channels.createMany).not.toHaveBeenCalled();
  });
});

describe('syncChannels', () => {
  const [category] = Object.keys(env.BRIDGE_CATEGORIES);
  const candidate = {
    id: '1', name: '🍕│food', topic: null, parentId: category, isPrivate: false,
  };

  it('writes new mappings and tells listeners which IRC channels to join', async () => {
    const listener = vi.fn();
    onMappingChange(listener);
    dbMock.$transaction.mockResolvedValue([] as never);
    dbMock.bridge_channels.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        mappingRow({ discord_channel_id: '1', irc_channel: '#food', source: 'auto' }),
      ] as never);

    const plan = await syncChannels([candidate]);

    expect(plan.create.map(row => row.irc_channel)).toEqual(['#food']);
    expect(dbMock.bridge_channels.createMany).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledWith({ added: ['#food'], removed: [], topics: [] });
  });

  it('writes nothing in a dry run', async () => {
    await syncChannels([candidate], { dryRun: true });
    expect(dbMock.bridge_channels.createMany).not.toHaveBeenCalled();
    expect(dbMock.$transaction).not.toHaveBeenCalled();
  });
});
