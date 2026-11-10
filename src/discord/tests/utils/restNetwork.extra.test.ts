import { createCachedLookup, createDiscordAgent, installRestRetry } from '../../utils/restNetwork';

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
});
