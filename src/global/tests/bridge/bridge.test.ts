import type { BridgeGateway, BridgeOutgoing, BridgeTarget } from '../../bridge/bridge.types';
import { getGateways, setMappings } from '../../bridge/bridge.mappings';
import {
  bridgeRows, LOUNGE_ID, mappingRow, MOVIES_ID,
} from '../../../vitest/utils/bridgeMappings';
import {
  bridgedChannels, findGateways, gatewayChannel, registerBridgeTarget, relayDeletion, relayMessage,
  unregisterBridgeTarget,
} from '../../bridge/bridge';

function target(platform: BridgeTarget['platform']) {
  const send = vi.fn<(channel: string, message: BridgeOutgoing) => Promise<void>>().mockResolvedValue(undefined);
  const bridgeTarget: BridgeTarget = { platform, send };
  registerBridgeTarget(bridgeTarget);
  return send;
}

const TV_MOVIES = '#tv-movies';

let ircSend: ReturnType<typeof target>;
let discordSend: ReturnType<typeof target>;

beforeEach(() => {
  setMappings(bridgeRows());
  ircSend = target('irc');
  discordSend = target('discord');
});

afterEach(() => {
  setMappings([]);
  unregisterBridgeTarget('irc');
  unregisterBridgeTarget('discord');
  unregisterBridgeTarget('matrix');
});

describe('gatewayChannel', () => {
  it('reads each platform\'s channel from the gateway', () => {
    const lounge = getGateways().find(gateway => gateway.irc === '#lounge') as BridgeGateway;
    expect(gatewayChannel(lounge, 'discord')).toBe(LOUNGE_ID);
    expect(gatewayChannel(lounge, 'irc')).toBe('#lounge');
    expect(gatewayChannel({ name: 'x' }, 'matrix')).toBeUndefined();
  });
});

describe('getGateways', () => {
  it('ignores inactive and disabled mappings', () => {
    setMappings([
      mappingRow(),
      mappingRow({ irc_channel: '#gone', active: false }),
      mappingRow({ irc_channel: '#off', enabled: false }),
    ]);
    expect(getGateways().map(gateway => gateway.irc)).toEqual(['#lounge']);
    expect(findGateways('irc', '#gone')).toEqual([]);
  });
});

describe('findGateways', () => {
  it('matches IRC channels case-insensitively', () => {
    expect(findGateways('irc', '#LOUNGE').map(gateway => gateway.name)).toEqual(['Lounge']);
  });

  it('returns every gateway that shares a Discord channel', () => {
    expect(findGateways('discord', MOVIES_ID).map(gateway => gateway.name)).toEqual(['Movies', 'TV-Movies']);
  });

  it('returns nothing for unbridged channels', () => {
    expect(findGateways('irc', '#not-bridged')).toEqual([]);
  });
});

describe('bridgedChannels', () => {
  it('lists each bridged IRC channel once', () => {
    const channels = bridgedChannels('irc');
    expect(channels).toContain('#lounge');
    expect(new Set(channels).size).toBe(channels.length);
    expect(channels).toEqual(['###dev-sandbox', '#lounge', '#movies', TV_MOVIES]);
  });
});

describe('relayMessage', () => {
  it('skips a registered platform when the gateway has no channel for it', async () => {
    const matrixSend = target('matrix');
    await relayMessage({
      platform: 'irc', channel: '#movies', nick: 'Moonbear', text: 'hi',
    });
    expect(discordSend).toHaveBeenCalledWith(MOVIES_ID, expect.anything());
    expect(matrixSend).not.toHaveBeenCalled();
  });

  it('sends to the matching channel on other platforms', async () => {
    await relayMessage({
      platform: 'irc', channel: '#lounge', nick: 'Moonbear', text: 'hi',
    });

    expect(ircSend).not.toHaveBeenCalled();
    expect(discordSend).toHaveBeenCalledWith(LOUNGE_ID, {
      gateway: 'Lounge',
      sourcePlatform: 'irc',
      nick: 'Moonbear',
      text: 'hi',
      action: false,
      avatarUrl: undefined,
    });
  });

  it('skips platforms without a registered target', async () => {
    unregisterBridgeTarget('irc');
    await relayMessage({
      platform: 'discord', channel: LOUNGE_ID, nick: 'Moonbear', text: 'hi',
    });
    expect(ircSend).not.toHaveBeenCalled();
  });

  it('sends a Discord message to every IRC channel that shares it', async () => {
    await relayMessage({
      platform: 'discord', channel: MOVIES_ID, nick: 'Moonbear', text: 'hi',
    });
    expect(ircSend.mock.calls.map(([channel]) => channel)).toEqual(['#movies', TV_MOVIES]);
  });

  it('delivers to a shared Discord channel only once', async () => {
    const matrixSend = target('matrix');
    await relayMessage({
      platform: 'irc', channel: TV_MOVIES, nick: 'Moonbear', text: 'hi',
    });
    expect(discordSend).toHaveBeenCalledTimes(1);
    expect(matrixSend).toHaveBeenCalledWith('!gQijCMLYtqXWKYNyXs:tripsit.me', expect.anything());
  });

  it('passes actions and avatars through', async () => {
    await relayMessage({
      platform: 'discord', channel: LOUNGE_ID, nick: 'Moonbear', text: 'waves', action: true, avatarUrl: 'https://a',
    });
    expect(ircSend).toHaveBeenCalledWith('#lounge', expect.objectContaining({ action: true, avatarUrl: 'https://a' }));
  });

  it.each(['Github', 'TSDev', 'tsdev1', 'TS1', 'TS11'])('ignores messages from %s', async nick => {
    await relayMessage({
      platform: 'irc', channel: '#lounge', nick, text: 'hi',
    });
    expect(discordSend).not.toHaveBeenCalled();
  });

  it('ignores blank messages and unbridged channels', async () => {
    await relayMessage({
      platform: 'irc', channel: '#lounge', nick: 'Moonbear', text: '   ',
    });
    await relayMessage({
      platform: 'irc', channel: '#elsewhere', nick: 'Moonbear', text: 'hi',
    });
    expect(discordSend).not.toHaveBeenCalled();
  });

  it('neutralizes @everyone and @here and applies nick replacements', async () => {
    await relayMessage({
      platform: 'irc', channel: '#lounge', nick: 'zmzm', text: '@everyone look @here',
    });
    expect(discordSend).toHaveBeenCalledWith(LOUNGE_ID, expect.objectContaining({
      nick: 'zimzim',
      text: 'everyone look here',
    }));
  });

  it('keeps delivering to other platforms when one target fails', async () => {
    const matrixSend = target('matrix');
    discordSend.mockRejectedValueOnce(new Error('webhook missing'));
    const logError = vi.spyOn(global.log, 'error').mockReturnValue(undefined as never);

    await relayMessage({
      platform: 'irc', channel: '#lounge', nick: 'Moonbear', text: 'hi',
    });

    expect(matrixSend).toHaveBeenCalled();
    expect(logError).toHaveBeenCalledWith('bridge', expect.stringContaining('webhook missing'));
    logError.mockRestore();
  });
});

describe('relayDeletion', () => {
  it('skips targets whose gateway has no destination channel', async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    registerBridgeTarget({ platform: 'matrix', send: vi.fn(), remove });
    await relayDeletion({ platform: 'irc', channel: '#movies', id: 'm1' });
    expect(remove).not.toHaveBeenCalled();
  });

  it('asks other platforms that can delete to remove the message', async () => {
    const remove = vi.fn<(channel: string, sourceId: string) => Promise<void>>().mockResolvedValue(undefined);
    registerBridgeTarget({ platform: 'irc', send: ircSend, remove });

    await relayDeletion({ platform: 'discord', channel: LOUNGE_ID, id: 'm1' });

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith('#lounge', 'm1');
  });

  it('skips targets that cannot delete and unbridged channels', async () => {
    await expect(relayDeletion({ platform: 'discord', channel: LOUNGE_ID, id: 'm1' })).resolves.toBeUndefined();
    const remove = vi.fn().mockResolvedValue(undefined);
    registerBridgeTarget({ platform: 'irc', send: ircSend, remove });
    await relayDeletion({ platform: 'discord', channel: 'elsewhere', id: 'm1' });
    expect(remove).not.toHaveBeenCalled();
  });

  it('logs and survives a failing target', async () => {
    vi.spyOn(global.log, 'error').mockReturnValue(undefined as never);
    registerBridgeTarget({ platform: 'irc', send: ircSend, remove: vi.fn().mockRejectedValue(new Error('boom')) });
    await expect(relayDeletion({ platform: 'discord', channel: LOUNGE_ID, id: 'm1' })).resolves.toBeUndefined();
    expect(global.log.error).toHaveBeenCalledWith('bridge', expect.stringContaining('boom'));
  });
});
