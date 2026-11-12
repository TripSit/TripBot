/* eslint-disable sonarjs/no-duplicate-string */
import {
  createCachedLookup, createDiscordAgent, installRestRetry, withConnectRetry,
} from '../../utils/restNetwork';

describe('restNetwork extras', () => {
  it('serves repeated lookups from the cache, including numeric family options', async () => {
    const lookup = vi.fn((_host: string, _opts: unknown, cb: (e: null, a: string, f: number) => void) => cb(null, '1.2.3.4', 4));
    const cached = createCachedLookup(lookup as never, 60_000);
    const first = vi.fn();
    cached('discord.com', 4, first);
    await vi.waitFor(() => expect(first).toHaveBeenCalledWith(null, '1.2.3.4', 4));
    const second = vi.fn();
    cached('discord.com', 4, second);
    await vi.waitFor(() => expect(second).toHaveBeenCalledWith(null, '1.2.3.4', 4));
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it('builds a discord agent', async () => {
    const agent = createDiscordAgent();
    expect(agent).toBeDefined();
    await agent.close();
  });

  it('wraps the REST client request function with connect retries', async () => {
    const original = vi.fn(async () => 'ok');
    const rest = { options: { makeRequest: original } };
    installRestRetry(rest as never);
    expect(rest.options.makeRequest).not.toBe(original);
    await expect((rest.options.makeRequest as unknown as (u: string, i: unknown) => Promise<string>)('https://discord.com/api/v10/x', {})).resolves.toBe('ok');
    expect(original).toHaveBeenCalledTimes(1);
  });

  it('warns about slow lookups, whether they succeed or fail', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      const warn = vi.spyOn(global.log, 'warn').mockReturnValue(undefined as never);
      const slow = (result: 'ok' | 'fail') => vi.fn((_h: string, _o: unknown, cb: (e: unknown, a?: string, f?: number) => void) => {
        vi.setSystemTime(Date.now() + 2500);
        if (result === 'ok') cb(null, '1.2.3.4', 4); else cb(Object.assign(new Error('x'), { code: 'ENOTFOUND' }));
      });
      const good = createCachedLookup(slow('ok') as never);
      good('discord.com', {}, vi.fn());
      expect(warn).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('and succeeded'));
      const bad = createCachedLookup(slow('fail') as never);
      const failed = vi.fn();
      bad('discord.com', {}, failed);
      expect(warn).toHaveBeenCalledWith(expect.anything(), expect.stringContaining('failed: ENOTFOUND'));
      expect(failed).toHaveBeenCalledWith(expect.objectContaining({ code: 'ENOTFOUND' }));
    } finally {
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });

  it('waits with its own timer between connect retries by default', async () => {
    vi.spyOn(global.log, 'warn').mockReturnValue(undefined as never);
    const failure = Object.assign(new Error('timeout'), { code: 'UND_ERR_CONNECT_TIMEOUT' });
    const base = vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce('ok');
    const wrapped = withConnectRetry(base as never, { retries: 1, delayMs: 1 });
    await expect((wrapped as unknown as (u: string, i: unknown) => Promise<string>)('https://discord.com/api/v10/x', {})).resolves.toBe('ok');
    expect(base).toHaveBeenCalledTimes(2);
    vi.restoreAllMocks();
  });
});
