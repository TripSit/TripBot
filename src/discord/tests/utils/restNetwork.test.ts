import http from 'http';
import type { AddressInfo } from 'net';
import { request as undiciRequest } from 'undici';
import {
  DiscordRestNetworkError,
  createCachedLookup,
  createDiscordAgent,
  withConnectRetry,
} from '../../utils/restNetwork';

const timeoutError = () => Object.assign(
  new Error('Connect Timeout Error (attempted addresses: 1.1.1.1:443, timeout: 15000ms)'),
  { code: 'UND_ERR_CONNECT_TIMEOUT' },
);
const GATEWAY = 'https://discord.com/api/v10/gateway';
const HOST = 'discord.com';
const AGAIN = 'again';
const noWait = { wait: async () => {}, delayMs: 1 };

describe('withConnectRetry', () => {
  it('retries a connect timeout, including for POST, then succeeds', async () => {
    const base = vi.fn()
      .mockRejectedValueOnce(timeoutError())
      .mockRejectedValueOnce(timeoutError())
      .mockResolvedValue('ok');
    const request = withConnectRetry(base, noWait);
    await expect(request('https://discord.com/api/v10/channels/1/messages', { method: 'POST' } as never))
      .resolves.toBe('ok');
    expect(base).toHaveBeenCalledTimes(3);
  });

  it('names the call and the addresses when it gives up', async () => {
    const base = vi.fn().mockRejectedValue(timeoutError());
    const request = withConnectRetry(base, { ...noWait, retries: 1 });
    const failure = await request('https://discord.com/api/v10/webhooks/1/tok?wait=true', { method: 'post' } as never)
      .catch((e: Error & { code?: string }) => e);
    expect(failure).toBeInstanceOf(DiscordRestNetworkError);
    expect(failure.message).toContain('POST /webhooks/1/<token> failed after 2 attempts');
    expect(failure.message).toContain('1.1.1.1:443');
    expect(failure.message).not.toContain('tok?');
    expect(failure.code).toBe('UND_ERR_CONNECT_TIMEOUT');
    expect(base).toHaveBeenCalledTimes(2);
  });

  it('does not retry other errors', async () => {
    const reset = Object.assign(new Error('reset'), { code: 'ECONNRESET' });
    const base = vi.fn().mockRejectedValue(reset);
    const request = withConnectRetry(base, noWait);
    await expect(request(GATEWAY, {} as never)).rejects.toBe(reset);
    expect(base).toHaveBeenCalledTimes(1);
  });

  it('stops retrying once the request was aborted', async () => {
    const base = vi.fn().mockRejectedValue(timeoutError());
    const controller = new AbortController();
    controller.abort();
    const request = withConnectRetry(base, noWait);
    await expect(request(GATEWAY, { signal: controller.signal } as never))
      .rejects.toBeInstanceOf(DiscordRestNetworkError);
    expect(base).toHaveBeenCalledTimes(1);
  });
});

describe('createCachedLookup', () => {
  const answer = [[{ address: '1.1.1.1', family: 4 }]];

  it('serves repeated lookups from the cache', async () => {
    const lookup = vi.fn((_h: string, _o: unknown, cb: (...a: unknown[]) => void) => cb(null, ...answer));
    const cached = createCachedLookup(lookup as never, 60_000);
    const call = () => new Promise(resolve => { cached(HOST, { all: true }, (...a) => resolve(a)); });
    expect(await call()).toEqual([null, ...answer]);
    expect(await call()).toEqual([null, ...answer]);
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it('serves a stale answer when a fresh lookup fails', async () => {
    const lookup = vi.fn()
      .mockImplementationOnce((_h, _o, cb) => cb(null, ...answer))
      .mockImplementationOnce((_h, _o, cb) => cb(Object.assign(new Error(AGAIN), { code: 'EAI_AGAIN' })));
    const cached = createCachedLookup(lookup as never, 0);
    const call = () => new Promise(resolve => { cached(HOST, { all: true }, (...a) => resolve(a)); });
    await call();
    expect(await call()).toEqual([null, ...answer]);
  });

  it('reports the failure when there is nothing cached', async () => {
    const error = Object.assign(new Error(AGAIN), { code: 'EAI_AGAIN' });
    const lookup = vi.fn((_h: string, _o: unknown, cb: (...a: unknown[]) => void) => cb(error));
    const cached = createCachedLookup(lookup as never);
    const result = await new Promise(resolve => {
      cached(HOST, {}, (...a) => resolve(a));
    });
    expect(result).toEqual([error]);
  });
});

describe('createDiscordAgent', () => {
  it('connects through the cached lookup', async () => {
    const server = http.createServer((_req, res) => { res.end('pong'); });
    await new Promise<void>(resolve => { server.listen(0, '127.0.0.1', resolve); });
    const agent = createDiscordAgent();
    try {
      const { port } = server.address() as AddressInfo;
      const res = await undiciRequest(`http://localhost:${port}/`, { dispatcher: agent });
      expect(await res.body.text()).toBe('pong');
    } finally {
      await agent.close();
      server.close();
    }
  });
});
