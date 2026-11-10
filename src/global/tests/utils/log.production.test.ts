import { TextChannel } from 'discord.js';

const mocks = vi.hoisted(() => ({ sentryInit: vi.fn(), rollbarCtor: vi.fn() }));

vi.mock('@sentry/node', () => ({ init: mocks.sentryInit }));
vi.mock('rollbar', () => ({
  default: class {
    warn = vi.fn();

    constructor(config: unknown) {
      mocks.rollbarCtor(config);
    }
  },
}));

const originalEnv = process.env.NODE_ENV;
const originalLog = global.log;
const originalRollbar = global.rollbar;

async function loadProductionLog() {
  process.env.NODE_ENV = 'production';
  vi.resetModules();
  return (await import('../../utils/log')).log;
}

const textChannel = () => Object.assign(Object.create(TextChannel.prototype), { send: vi.fn(), messages: {} });

afterEach(() => {
  process.env.NODE_ENV = originalEnv;
  global.log = originalLog;
  global.rollbar = originalRollbar;
  delete (global as { discordClient?: unknown }).discordClient;
  vi.restoreAllMocks();
});

describe('production logging setup', () => {
  it('initialises rollbar and sentry', async () => {
    await loadProductionLog();
    expect(mocks.rollbarCtor).toHaveBeenCalledWith(expect.objectContaining({ logLevel: 'error' }));
    expect(mocks.sentryInit).toHaveBeenCalledWith(expect.objectContaining({ environment: 'production' }));
    expect(global.rollbar).toBeDefined();
  });

  it('exposes the filename helper', async () => {
    await loadProductionLog();
    expect(global.f('/some/dir/file.name.ts')).toBe('file.name');
  });
});

describe('Discord log transport', () => {
  const nextTick = () => new Promise(resolve => { setTimeout(resolve, 50); });

  it('posts logs to the errors channel with a level prefix', async () => {
    const channel = textChannel();
    (global as unknown as { discordClient: unknown }).discordClient = {
      isReady: () => true, channels: { fetch: vi.fn(async () => channel) },
    };
    const log = await loadProductionLog();
    log.error('F', 'it broke');
    await vi.waitFor(() => expect(channel.send).toHaveBeenCalledWith(expect.stringContaining('❌')));
    expect(channel.send.mock.calls[0][0]).toContain('it broke');
  });

  it('does nothing when the client is missing or not ready', async () => {
    const fetch = vi.fn();
    const log = await loadProductionLog();
    log.info('F', 'before login');
    (global as unknown as { discordClient: unknown }).discordClient = { isReady: () => false, channels: { fetch } };
    log.info('F', 'still not ready');
    await nextTick();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['missing channels', async () => null],
    ['non-text channels', async () => ({ isTextBased: () => false })],
    ['text-like channels that are not TextChannel', async () => ({ isTextBased: () => true })],
  ])('ignores %s', async (_label, impl) => {
    const fetch = vi.fn(impl);
    (global as unknown as { discordClient: unknown }).discordClient = { isReady: () => true, channels: { fetch } };
    const log = await loadProductionLog();
    log.warn('F', 'Missing something');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
  });

  it('survives send failures', async () => {
    const channel = textChannel();
    channel.send.mockRejectedValue(new Error('Missing Permissions'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    (global as unknown as { discordClient: unknown }).discordClient = {
      isReady: () => true, channels: { fetch: vi.fn(async () => channel) },
    };
    const log = await loadProductionLog();
    log.debug('F', 'x');
    log.http('F', 'y');
    log.info('F', 'z');
    await vi.waitFor(() => expect(consoleError).toHaveBeenCalled());
  });
});
