import { HEARTBEAT_INTERVAL_MS } from '../../utils/heartbeat';

const load = async () => (await import('../../utils/heartbeat')).default;

describe('startHeartbeat', () => {
  const original = { url: process.env.HEARTBEAT_URL, token: env.DISCORD_CLIENT_TOKEN, irc: env.IRC_PASSWORD };
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    process.env.HEARTBEAT_URL = 'https://uptime.example/push/abc';
    env.DISCORD_CLIENT_TOKEN = 'token';
    env.IRC_PASSWORD = undefined as unknown as string;
    global.discordClient = { isReady: () => true } as unknown as typeof global.discordClient;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    if (original.url === undefined) delete process.env.HEARTBEAT_URL; else process.env.HEARTBEAT_URL = original.url;
    env.DISCORD_CLIENT_TOKEN = original.token;
    env.IRC_PASSWORD = original.irc;
    global.discordClient = undefined as unknown as typeof global.discordClient;
  });

  it('does nothing without a URL', async () => {
    delete process.env.HEARTBEAT_URL;
    (await load())();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('pings immediately and then every interval while healthy, and only starts once', async () => {
    const start = await load();
    start();
    start();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://uptime.example/push/abc');
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('stays quiet while unhealthy', async () => {
    global.discordClient = { isReady: () => false } as unknown as typeof global.discordClient;
    (await load())();
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('survives non-OK answers and network errors', async () => {
    const start = await load();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
    start();
    await vi.advanceTimersByTimeAsync(0);
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
