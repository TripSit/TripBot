import { EventEmitter } from 'events';
import type { Client } from 'irc-framework';
import type { Mock } from 'vitest';
import type { BridgeOutgoing } from '../../global/bridge/bridge.types';

type FakeClient = EventEmitter & {
  connected: boolean;
  user: { nick: string };
  network: { cap: { isEnabled: Mock }; supports: Mock };
  requestCap: Mock;
  raw: Mock;
  say: Mock;
};

const BOT = 'TripBotDev';
const LOUNGE_ID = 'discord-lounge';
const RELAYED_NICK = 'Moonbear/d';
const FALLBACK_HELLO = '<Moonbear/d> hello';
const PRIVS_NEEDED = 'PRIVS_NEEDED';
const FAIL = 'FAIL';
const UNKNOWN_COMMAND = 'unknown command';

let bridge: typeof import('../bridge');
let core: typeof import('../../global/bridge/bridge');
let client: FakeClient;
let discordSend: Mock;
const originalEnv = { CHANNEL_LOUNGE: env.CHANNEL_LOUNGE, IRC_CHANNELS: env.IRC_CHANNELS };

function outgoing(overrides: Partial<BridgeOutgoing> = {}): BridgeOutgoing {
  return {
    gateway: 'Lounge', sourcePlatform: 'discord', nick: 'Moonbear', text: 'hello', action: false, ...overrides,
  };
}

async function sendToIrc(message: BridgeOutgoing, channel = '#lounge') {
  const target = bridge.createIrcBridgeTarget(client as unknown as Client);
  await target.send(channel, message);
}

function ircMessage(event: string, overrides: Record<string, unknown> = {}) {
  client.emit(event, {
    from_server: false,
    nick: 'Someone',
    ident: 'someone',
    hostname: 'host',
    target: '#lounge',
    message: 'hi there',
    tags: {},
    ...overrides,
  });
}

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  env.CHANNEL_LOUNGE = LOUNGE_ID;
  env.IRC_CHANNELS = [];
  bridge = await import('../bridge');
  core = await import('../../global/bridge/bridge');
  client = Object.assign(new EventEmitter(), {
    connected: true,
    user: { nick: BOT },
    network: { cap: { isEnabled: vi.fn(() => true) }, supports: vi.fn(() => '32') },
    requestCap: vi.fn(),
    raw: vi.fn(),
    say: vi.fn(),
  });
  discordSend = vi.fn().mockResolvedValue(undefined);
  core.registerBridgeTarget({ platform: 'discord', send: discordSend });
  vi.spyOn(global.log, 'warn').mockReturnValue(undefined as never);
  vi.spyOn(global.log, 'error').mockReturnValue(undefined as never);
  vi.spyOn(global.log, 'debug').mockReturnValue(undefined as never);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Object.assign(env, originalEnv);
});

describe('IRC bridge target', () => {
  it('relays with RELAYMSG as name/label', async () => {
    await sendToIrc(outgoing());
    expect(client.raw).toHaveBeenCalledWith('RELAYMSG', '#lounge', RELAYED_NICK, 'hello');
    expect(client.say).not.toHaveBeenCalled();
  });

  it('labels Matrix users with M', async () => {
    await sendToIrc(outgoing({ sourcePlatform: 'matrix' }));
    expect(client.raw).toHaveBeenCalledWith('RELAYMSG', '#lounge', 'Moonbear/M', 'hello');
  });

  it('falls back to <nick> messages when the server lacks RELAYMSG', async () => {
    client.network.cap.isEnabled.mockReturnValue(false);
    await sendToIrc(outgoing());
    expect(client.say).toHaveBeenCalledWith('#lounge', FALLBACK_HELLO);
  });

  it('sends actions as CTCP ACTION, or as * nick in the fallback', async () => {
    await sendToIrc(outgoing({ action: true, text: 'waves' }));
    expect(client.raw).toHaveBeenCalledWith('RELAYMSG', '#lounge', RELAYED_NICK, '\x01ACTION waves\x01');

    client.network.cap.isEnabled.mockReturnValue(false);
    await sendToIrc(outgoing({ action: true, text: 'waves' }));
    await vi.advanceTimersByTimeAsync(bridge.IRC_MESSAGE_DELAY_MS);
    expect(client.say).toHaveBeenCalledWith('#lounge', '* Moonbear/d waves');
  });

  it('strips markdown and sends one line at a time, one second apart', async () => {
    await sendToIrc(outgoing({ text: '**first**\nsecond' }));
    expect(client.raw).toHaveBeenCalledTimes(1);
    expect(client.raw).toHaveBeenLastCalledWith('RELAYMSG', '#lounge', RELAYED_NICK, 'first');

    await vi.advanceTimersByTimeAsync(bridge.IRC_MESSAGE_DELAY_MS - 1);
    expect(client.raw).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(client.raw).toHaveBeenLastCalledWith('RELAYMSG', '#lounge', RELAYED_NICK, 'second');
  });

  it('keeps lines short enough for the fallback prefix', async () => {
    await sendToIrc(outgoing({ text: 'word '.repeat(200) }));
    await vi.advanceTimersByTimeAsync(10 * bridge.IRC_MESSAGE_DELAY_MS);
    const prefix = Buffer.byteLength('<Moonbear/d> ');
    client.raw.mock.calls.forEach(([, , , text]) => {
      expect(Buffer.byteLength(text) + prefix).toBeLessThanOrEqual(bridge.IRC_MESSAGE_BYTES);
    });
  });

  it('uses the server nick length', async () => {
    client.network.supports.mockReturnValue('8');
    await sendToIrc(outgoing({ nick: 'Moonbearington' }));
    expect(client.raw).toHaveBeenCalledWith('RELAYMSG', '#lounge', 'Moonbe/d', 'hello');
  });

  it('drops lines beyond the queue limit', async () => {
    const text = Array.from({ length: bridge.IRC_MESSAGE_QUEUE + 10 }, (_, i) => `line ${i}`).join('\n');
    await sendToIrc(outgoing({ text }));
    await vi.advanceTimersByTimeAsync(100 * bridge.IRC_MESSAGE_DELAY_MS);
    // The first line is sent immediately, then the queue holds up to the limit
    expect(client.raw).toHaveBeenCalledTimes(bridge.IRC_MESSAGE_QUEUE);
    expect(global.log.warn).toHaveBeenCalledWith('bridge', expect.stringContaining('dropped 10 line(s)'));
  });

  it('keeps a separate queue per channel', async () => {
    await sendToIrc(outgoing({ text: '1\n2\n3' }), '#lounge');
    await sendToIrc(outgoing({ text: 'other' }), '#movies');
    // The second channel is not stuck behind the first channel's backlog
    expect(client.raw).toHaveBeenCalledWith('RELAYMSG', '#movies', RELAYED_NICK, 'other');
    expect(client.raw).toHaveBeenCalledTimes(2);
  });

  it('limits each channel separately', async () => {
    const lines = (n: number) => Array.from({ length: n }, (_, i) => `line ${i}`).join('\n');
    await sendToIrc(outgoing({ text: lines(bridge.IRC_MESSAGE_QUEUE + 5) }), '#lounge');
    await sendToIrc(outgoing({ text: lines(bridge.IRC_MESSAGE_QUEUE) }), '#movies');
    await vi.advanceTimersByTimeAsync(100 * bridge.IRC_MESSAGE_DELAY_MS);
    expect(client.raw).toHaveBeenCalledTimes(2 * bridge.IRC_MESSAGE_QUEUE);
  });

  it('drops messages while disconnected', async () => {
    client.connected = false;
    await sendToIrc(outgoing());
    await vi.advanceTimersByTimeAsync(bridge.IRC_MESSAGE_DELAY_MS);
    expect(client.raw).not.toHaveBeenCalled();
  });
});

describe('registerIrcBridge', () => {
  beforeEach(() => {
    bridge.registerIrcBridge(client as unknown as Client);
  });

  it('requests the RELAYMSG capability', () => {
    expect(client.requestCap).toHaveBeenCalledWith(['draft/relaymsg', 'echo-message']);
  });

  it('relays channel messages to Discord without IRC formatting', async () => {
    ircMessage('privmsg', { message: '\x02bold\x02 text' });
    await vi.waitFor(() => expect(discordSend).toHaveBeenCalled());
    expect(discordSend).toHaveBeenCalledWith(LOUNGE_ID, expect.objectContaining({
      nick: 'Someone', text: 'bold text', action: false, sourcePlatform: 'irc',
    }));
  });

  it('relays actions', async () => {
    ircMessage('action', { message: 'waves' });
    await vi.waitFor(() => expect(discordSend).toHaveBeenCalled());
    expect(discordSend).toHaveBeenCalledWith(LOUNGE_ID, expect.objectContaining({ action: true, text: 'waves' }));
  });

  it.each([
    ['its own messages', { nick: BOT }],
    ['server messages', { from_server: true }],
    ['messages it relayed', { nick: RELAYED_NICK, tags: { 'draft/relaymsg': BOT } }],
    ['relayed nicks without the tag', { nick: RELAYED_NICK }],
    ['unbridged channels', { target: '#elsewhere' }],
    ['private messages', { target: BOT }],
    ['history replayed on join', { batch: { id: '1', type: 'chathistory', params: ['#lounge'] } }],
  ])('ignores %s', async (_name, overrides) => {
    ircMessage('privmsg', overrides);
    await vi.advanceTimersByTimeAsync(0);
    expect(discordSend).not.toHaveBeenCalled();
  });

  it('relays messages another relayer sent', async () => {
    ircMessage('privmsg', { nick: 'Other/t', tags: { 'draft/relaymsg': 'OtherBridge' } });
    await vi.waitFor(() => expect(discordSend).toHaveBeenCalled());
  });

  it('falls back to plain messages after RELAYMSG is refused, until the next registration', async () => {
    client.emit(UNKNOWN_COMMAND, { command: FAIL, params: ['RELAYMSG', PRIVS_NEEDED, 'nope'], tags: {} });
    await sendToIrc(outgoing());
    expect(client.say).toHaveBeenCalledWith('#lounge', FALLBACK_HELLO);
    expect(global.log.error).toHaveBeenCalledWith('bridge', expect.stringContaining(PRIVS_NEEDED));

    client.emit('registered', { nick: BOT, tags: {} });
    await vi.advanceTimersByTimeAsync(bridge.IRC_MESSAGE_DELAY_MS);
    await sendToIrc(outgoing());
    expect(client.raw).toHaveBeenCalledWith('RELAYMSG', '#lounge', RELAYED_NICK, 'hello');
  });

  it('ignores FAIL replies for other commands', async () => {
    client.emit(UNKNOWN_COMMAND, { command: FAIL, params: ['CHATHISTORY', 'x'], tags: {} });
    await sendToIrc(outgoing());
    expect(client.raw).toHaveBeenCalled();
  });
});

describe('redacting relayed messages', () => {
  let target: ReturnType<typeof bridge.createIrcBridgeTarget>;

  beforeEach(() => {
    bridge.registerIrcBridge(client as unknown as Client);
    target = bridge.createIrcBridgeTarget(client as unknown as Client);
  });

  const echo = (message: string, msgid: string, overrides: Record<string, unknown> = {}) => ircMessage('privmsg', {
    nick: RELAYED_NICK, message, tags: { 'draft/relaymsg': BOT, msgid }, ...overrides,
  });

  it('redacts every line of a deleted message', async () => {
    await target.send('#lounge', outgoing({ sourceId: 'd1', text: 'one\ntwo' }));
    echo('one', 'id-1');
    await vi.advanceTimersByTimeAsync(bridge.IRC_MESSAGE_DELAY_MS);
    echo('two', 'id-2');

    await target.remove?.('#lounge', 'd1');
    expect(client.raw).toHaveBeenCalledWith('REDACT', '#lounge', 'id-1');
    expect(client.raw).toHaveBeenCalledWith('REDACT', '#lounge', 'id-2');
    expect(discordSend).not.toHaveBeenCalled();
  });

  it('tracks fallback messages sent as the bot itself', async () => {
    client.network.cap.isEnabled.mockReturnValue(false);
    await target.send('#lounge', outgoing({ sourceId: 'd1' }));
    ircMessage('privmsg', { nick: BOT, message: FALLBACK_HELLO, tags: { msgid: 'id-1' } });
    await target.remove?.('#lounge', 'd1');
    expect(client.raw).toHaveBeenCalledWith('REDACT', '#lounge', 'id-1');
  });

  it('tracks relayed actions', async () => {
    await target.send('#lounge', outgoing({ sourceId: 'd1', action: true, text: 'waves' }));
    echo('waves', 'id-1', {});
    // An action echo arrives as an action event, not a privmsg
    client.emit('action', {
      from_server: false,
      nick: RELAYED_NICK,
      target: '#lounge',
      message: 'waves',
      tags: { 'draft/relaymsg': BOT, msgid: 'id-2' },
    });
    await target.remove?.('#lounge', 'd1');
    expect(client.raw).toHaveBeenCalledWith('REDACT', '#lounge', 'id-2');
    expect(client.raw).not.toHaveBeenCalledWith('REDACT', '#lounge', 'id-1');
  });

  it('does nothing for messages it never relayed or whose echo did not match', async () => {
    await target.send('#lounge', outgoing({ sourceId: 'd1' }));
    echo('something else', 'id-1');
    await target.remove?.('#lounge', 'd1');
    await target.remove?.('#lounge', 'unknown');
    expect(client.raw).not.toHaveBeenCalledWith('REDACT', expect.anything(), expect.anything());
  });

  it('removes lines that are still queued', async () => {
    await target.send('#lounge', outgoing({ sourceId: 'd1', text: 'one\ntwo' }));
    await target.remove?.('#lounge', 'd1');
    await vi.advanceTimersByTimeAsync(5 * bridge.IRC_MESSAGE_DELAY_MS);
    expect(client.raw).toHaveBeenCalledTimes(1);
  });

  it('logs when the server refuses a redaction', () => {
    client.emit(UNKNOWN_COMMAND, { command: FAIL, params: ['REDACT', 'REDACT_FORBIDDEN', 'no'], tags: {} });
    expect(global.log.warn).toHaveBeenCalledWith('bridge', expect.stringContaining('REDACT_FORBIDDEN'));
  });
});

describe('ircChannels', () => {
  it('joins every bridged channel by default', () => {
    expect(bridge.ircChannels()).toEqual(core.bridgedChannels('irc'));
    expect(bridge.ircChannels()).toContain('###dev-sandbox');
  });

  it('uses IRC_CHANNELS when set', () => {
    env.IRC_CHANNELS = ['#lounge'];
    expect(bridge.ircChannels()).toEqual(['#lounge']);
  });
});
