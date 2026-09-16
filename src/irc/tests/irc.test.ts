import type { EventEmitter } from 'events';
import type { Mock } from 'vitest';

type FakeClient = EventEmitter & {
  connected: boolean;
  user: { nick: string };
  connect: Mock;
  join: Mock;
  raw: Mock;
  changeNick: Mock;
  quit: Mock;
};

const clients = vi.hoisted((): FakeClient[] => []);

vi.mock('irc-framework', async () => {
  const { EventEmitter: Emitter } = await import('events');
  class Client extends Emitter {
    connected = false;

    user = { nick: '' };

    connect = vi.fn();

    join = vi.fn();

    raw = vi.fn();

    changeNick = vi.fn();

    quit = vi.fn();

    constructor() {
      super();
      clients.push(this as unknown as FakeClient);
    }
  }
  return { Client };
});

const NICK = 'TripBotDev';
const ircEnv = {
  IRC_SERVER: 'irc.example.test',
  IRC_PORT: 6697,
  IRC_TLS: true,
  IRC_USERNAME: NICK,
  IRC_NICK: NICK,
  IRC_PASSWORD: 'sasl-password',
  IRC_CHANNELS: ['#lounge', '#sandbox'],
  IRC_OPER_NAME: undefined as string | undefined,
  IRC_OPER_PASSWORD: undefined as string | undefined,
};
const originalEnv: Record<string, unknown> = {};

let irc: typeof import('../irc');
let client: FakeClient;
let logInfo: Mock;
let logWarn: Mock;
let logError: Mock;

async function connect() {
  irc = await import('../irc');
  await irc.default();
  [client] = clients;
}

function register() {
  client.user.nick = NICK;
  client.emit('registered', { nick: NICK, tags: {} });
}

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  clients.length = 0;
  Object.entries(ircEnv).forEach(([key, value]) => {
    originalEnv[key] = env[key];
    env[key] = value;
  });
  logInfo = vi.spyOn(global.log, 'info').mockReturnValue(undefined as never) as unknown as Mock;
  logWarn = vi.spyOn(global.log, 'warn').mockReturnValue(undefined as never) as unknown as Mock;
  logError = vi.spyOn(global.log, 'error').mockReturnValue(undefined as never) as unknown as Mock;
});

afterEach(() => {
  irc?.ircDisconnect();
  vi.useRealTimers();
  vi.restoreAllMocks();
  Object.entries(originalEnv).forEach(([key, value]) => {
    env[key] = value;
  });
});

describe('ircConnect', () => {
  it('registers the IRC event handlers', async () => {
    await connect();

    expect(client.listenerCount('privmsg')).toBe(1);
  });

  it('connects with TLS and SASL using the configured account', async () => {
    await connect();

    expect(global.ircClient).toBe(client);
    expect(client.connect).toHaveBeenCalledWith(expect.objectContaining({
      host: 'irc.example.test',
      port: 6697,
      tls: true,
      nick: NICK,
      username: NICK,
      account: { account: NICK, password: 'sasl-password' },
      auto_reconnect: false,
      sasl_disconnect_on_fail: true,
    }));
  });

  it('joins the configured channels on every registration', async () => {
    await connect();

    register();
    expect(client.join.mock.calls).toEqual([['#lounge'], ['#sandbox']]);

    client.emit('close', false);
    register();
    expect(client.join).toHaveBeenCalledTimes(4);
  });

  it('logs only its own channel joins', async () => {
    await connect();
    register();

    client.emit('join', { nick: NICK, channel: '#lounge' });
    client.emit('join', { nick: 'someone', channel: '#lounge' });

    expect(logInfo).toHaveBeenCalledWith('irc', 'Joined IRC channel #lounge');
    expect(logInfo.mock.calls.filter(([, message]) => String(message).startsWith('Joined'))).toHaveLength(1);
  });

  describe('oper', () => {
    it('does not send OPER without oper credentials', async () => {
      await connect();
      register();

      expect(client.raw).not.toHaveBeenCalled();
    });

    it('sends OPER after registering when oper credentials are set', async () => {
      env.IRC_OPER_NAME = 'tripbot';
      env.IRC_OPER_PASSWORD = 'oper-password';
      await connect();
      register();

      expect(client.raw).toHaveBeenCalledWith('OPER', 'tripbot', 'oper-password');
    });

    it('logs the result of the OPER attempt', async () => {
      env.IRC_OPER_NAME = 'tripbot';
      await connect();

      client.emit('unknown command', { command: '381', params: [], tags: {} });
      client.emit('unknown command', { command: '491', params: [], tags: {} });

      expect(logInfo).toHaveBeenCalledWith('irc', 'Opered up on IRC as tripbot');
      expect(logError).toHaveBeenCalledWith('irc', 'IRC OPER failed: no matching oper block for this host');
    });
  });

  describe('nick collisions', () => {
    it('falls back to an alternate nick while registering', async () => {
      await connect();

      client.emit('nick in use', { nick: NICK, reason: 'Nickname is already in use' });

      expect(client.changeNick).toHaveBeenCalledWith(`${NICK}_`);
    });

    it('ignores nick collisions after registration', async () => {
      await connect();
      register();

      client.emit('nick in use', { nick: 'Other', reason: 'Nickname is already in use' });

      expect(client.changeNick).not.toHaveBeenCalled();
    });
  });

  describe('reconnecting', () => {
    it('reconnects with exponential backoff', async () => {
      await connect();

      client.emit('close', true);
      await vi.advanceTimersByTimeAsync(4_999);
      expect(client.connect).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(client.connect).toHaveBeenCalledTimes(2);

      client.emit('close', true);
      await vi.advanceTimersByTimeAsync(9_999);
      expect(client.connect).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);
      expect(client.connect).toHaveBeenCalledTimes(3);
    });

    it('caps the backoff at five minutes', async () => {
      await connect();

      for (let attempt = 0; attempt < 8; attempt += 1) {
        client.emit('close', true);
        await vi.advanceTimersByTimeAsync(300_000); // eslint-disable-line no-await-in-loop
      }

      expect(logWarn).toHaveBeenLastCalledWith('irc', 'Disconnected from IRC, reconnecting in 300s (attempt 8)');
    });

    it('resets the backoff after a successful registration', async () => {
      await connect();

      client.emit('close', true);
      await vi.advanceTimersByTimeAsync(5_000);
      client.emit('close', true);
      await vi.advanceTimersByTimeAsync(10_000);
      register();
      client.emit('close', true);

      expect(logWarn).toHaveBeenLastCalledWith('irc', 'Disconnected from IRC, reconnecting in 5s (attempt 1)');
    });

    it('schedules only one reconnect for repeated close events', async () => {
      await connect();

      client.emit('close', true);
      client.emit('close', true);
      await vi.advanceTimersByTimeAsync(300_000);

      expect(client.connect).toHaveBeenCalledTimes(2);
    });

    it('does not reconnect after a SASL failure', async () => {
      await connect();

      client.emit('sasl failed', { reason: 'fail', message: 'SASL authentication failed' });
      client.emit('close', true);
      await vi.advanceTimersByTimeAsync(300_000);

      expect(client.connect).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith('irc', 'IRC SASL authentication failed (fail): SASL authentication failed');
      expect(logError).toHaveBeenCalledWith('irc', 'Not reconnecting to IRC until the SASL credentials are fixed');
    });

    it('logs socket errors but not clean socket closes', async () => {
      await connect();

      client.emit('socket close', false);
      client.emit('socket close', new Error('certificate has expired'));

      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith('irc', 'IRC connection error: certificate has expired');
    });
  });
});

describe('ircDisconnect', () => {
  it('quits when connected', async () => {
    await connect();
    client.connected = true;

    irc.ircDisconnect('Bye');

    expect(client.quit).toHaveBeenCalledWith('Bye');
  });

  it('does not send QUIT when not connected', async () => {
    await connect();

    irc.ircDisconnect();

    expect(client.quit).not.toHaveBeenCalled();
  });

  it('cancels a pending reconnect and stops reconnecting', async () => {
    await connect();
    client.emit('close', true);

    irc.ircDisconnect();
    client.emit('close', false);
    await vi.advanceTimersByTimeAsync(300_000);

    expect(client.connect).toHaveBeenCalledTimes(1);
  });
});
