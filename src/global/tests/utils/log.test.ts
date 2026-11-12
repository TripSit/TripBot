import { describe, expect, it } from 'vitest';

describe('log.warn', () => {
  it('logs a warning without throwing', () => {
    expect(() => log.warn('test', 'something happened')).not.toThrow();
  });
});

describe('DiscordTransport', () => {
  const originalClient = global.discordClient;
  afterEach(() => { global.discordClient = originalClient; vi.restoreAllMocks(); });

  const load = async () => (await import('../../utils/log')).DiscordTransport;

  it('always calls back, even when Discord fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    global.discordClient = {
      isReady: () => true,
      channels: { fetch: vi.fn().mockRejectedValue(new Error('Connect Timeout Error')) },
    } as never;
    const Transport = await load();
    const callback = vi.fn();
    await new Transport().log({ level: 'error', message: 'transport failure' }, callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('does not touch Discord while it is not ready, and still calls back', async () => {
    const fetch = vi.fn();
    global.discordClient = { isReady: () => false, channels: { fetch } } as never;
    const Transport = await load();
    const callback = vi.fn();
    await new Transport().log({ level: 'info', message: 'quiet' }, callback);
    expect(fetch).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
