import type { BridgeOutgoing, BridgeTarget } from '../../bridge/bridge.types';
import { bridgeGateways } from '../../bridge/bridge.gateways';
import {
  bridgedChannels, findGateways, gatewayChannel, registerBridgeTarget, relayDeletion, relayMessage,
  unregisterBridgeTarget,
} from '../../bridge/bridge';

const LOUNGE_ID = 'discord-lounge';
const MOVIES_ID = 'discord-movies';
const originalEnv = { CHANNEL_LOUNGE: env.CHANNEL_LOUNGE, CHANNEL_MOVIES: env.CHANNEL_MOVIES };

function target(platform: BridgeTarget['platform']) {
  const send = vi.fn<(channel: string, message: BridgeOutgoing) => Promise<void>>().mockResolvedValue(undefined);
  const bridgeTarget: BridgeTarget = { platform, send };
  registerBridgeTarget(bridgeTarget);
  return send;
}

let ircSend: ReturnType<typeof target>;
let discordSend: ReturnType<typeof target>;

beforeEach(() => {
  env.CHANNEL_LOUNGE = LOUNGE_ID;
  env.CHANNEL_MOVIES = MOVIES_ID;
  ircSend = target('irc');
  discordSend = target('discord');
});

afterEach(() => {
  Object.assign(env, originalEnv);
  unregisterBridgeTarget('irc');
  unregisterBridgeTarget('discord');
  unregisterBridgeTarget('matrix');
});

describe('gateway list', () => {
  it('has unique names and IRC channel names', () => {
    const names = bridgeGateways.map(gateway => gateway.name);
    expect(new Set(names).size).toBe(names.length);
    bridgeGateways.forEach(gateway => expect(gateway.irc).toMatch(/^#/));
  });

  it('only references channel keys that exist in env.config', () => {
    bridgeGateways.forEach(gateway => {
      expect(Object.keys(env), gateway.name).toContain(gateway.discord);
    });
  });

  it('uses Matrix room IDs', () => {
    bridgeGateways
      .filter(gateway => gateway.matrix)
      .forEach(gateway => expect(gateway.matrix).toMatch(/^![A-Za-z]+:tripsit\.me$/));
  });
});

describe('gatewayChannel', () => {
  it('resolves Discord channels through env.config', () => {
    const lounge = { name: 'Lounge', irc: '#lounge', discord: 'CHANNEL_LOUNGE' };
    expect(bridgeGateways).toContainEqual(expect.objectContaining(lounge));
    expect(gatewayChannel(lounge, 'discord')).toBe(LOUNGE_ID);
    expect(gatewayChannel(lounge, 'irc')).toBe('#lounge');
  });

  it('treats an empty env channel as not bridged', () => {
    expect(gatewayChannel({ name: 'x', discord: 'CHANNEL_NOPE_NOT_REAL' }, 'discord')).toBeUndefined();
    const original = env.CHANNEL_LOUNGE;
    env.CHANNEL_LOUNGE = '';
    expect(gatewayChannel({ name: 'x', discord: 'CHANNEL_LOUNGE' }, 'discord')).toBeUndefined();
    env.CHANNEL_LOUNGE = original;
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
    expect(channels).toHaveLength(bridgeGateways.length);
  });
});

describe('relayMessage', () => {
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
    expect(ircSend.mock.calls.map(([channel]) => channel)).toEqual(['#movies', '#tv-movies']);
  });

  it('delivers to a shared Discord channel only once', async () => {
    const matrixSend = target('matrix');
    await relayMessage({
      platform: 'irc', channel: '#tv-movies', nick: 'Moonbear', text: 'hi',
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
