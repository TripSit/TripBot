vi.mock('dotenv', () => ({ default: { config: vi.fn() } }));

const IRC_KEYS = [
  'NODE_ENV', 'IRC_SERVER', 'IRC_PORT', 'IRC_TLS', 'IRC_USERNAME', 'IRC_NICK', 'IRC_CHANNELS', 'IRC_BOTPREFIX',
];
const originalGlobalEnv = global.env;

async function loadEnv(vars: Record<string, string | undefined>) {
  vi.resetModules();
  IRC_KEYS.forEach(key => vi.stubEnv(key, vars[key]));
  const { env } = await import('../../utils/env.config');
  return env;
}

afterEach(() => {
  vi.unstubAllEnvs();
  global.env = originalGlobalEnv;
});

describe('env IRC settings', () => {
  it('uses the dev IRC server outside production', async () => {
    const env = await loadEnv({ NODE_ENV: 'development' });
    expect(env.IRC_SERVER).toBe('irc.tripsit.io');
  });

  it('uses the production IRC server in production', async () => {
    const env = await loadEnv({ NODE_ENV: 'production' });
    expect(env.IRC_SERVER).toBe('irc.tripsit.me');
  });

  it('lets IRC_SERVER override the default', async () => {
    const env = await loadEnv({ NODE_ENV: 'production', IRC_SERVER: 'irc.example.test' });
    expect(env.IRC_SERVER).toBe('irc.example.test');
  });

  it('defaults to TLS on 6697 as TripBot in #lounge', async () => {
    const env = await loadEnv({});
    expect(env.IRC_PORT).toBe(6697);
    expect(env.IRC_TLS).toBe(true);
    expect(env.IRC_USERNAME).toBe('TripBot');
    expect(env.IRC_NICK).toBe('TripBot');
    expect(env.IRC_CHANNELS).toEqual(['#lounge']);
    expect(env.IRC_BOTPREFIX).toBe('!');
  });

  it('reads port, TLS, account, nick, and prefix overrides', async () => {
    const env = await loadEnv({
      IRC_PORT: '6667',
      IRC_TLS: 'false',
      IRC_USERNAME: 'TripBotDev',
      IRC_BOTPREFIX: '~',
    });
    expect(env.IRC_PORT).toBe(6667);
    expect(env.IRC_TLS).toBe(false);
    expect(env.IRC_NICK).toBe('TripBotDev');
    expect(env.IRC_BOTPREFIX).toBe('~');
  });

  it('prefers IRC_NICK over the account name', async () => {
    const env = await loadEnv({ IRC_USERNAME: 'TripBotDev', IRC_NICK: 'TripBotDev2' });
    expect(env.IRC_NICK).toBe('TripBotDev2');
  });

  it('parses a comma-separated channel list', async () => {
    const env = await loadEnv({ IRC_CHANNELS: ' #lounge, #sandbox ,,#dev ' });
    expect(env.IRC_CHANNELS).toEqual(['#lounge', '#sandbox', '#dev']);
  });
});
