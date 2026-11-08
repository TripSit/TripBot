import dns from 'dns';
import { Agent } from 'undici';
import type { REST } from 'discord.js';
import { describeError, isPreSendFailure, redactDiscordUrl } from '../../global/utils/networkErrors';

const F = f(__filename);

// undici's own default is 10s, which includes the DNS lookup and TLS handshake. Keep it below REST_TIMEOUT_MS
// so a slow connect can still be retried inside one request.
export const CONNECT_TIMEOUT_MS = 15_000;
export const REST_TIMEOUT_MS = 45_000;
const AUTO_SELECT_FAMILY_ATTEMPT_TIMEOUT_MS = 500;
const DNS_TTL_MS = 60_000;
const SLOW_LOOKUP_MS = 2_000;
const MAX_CONNECT_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

type LookupFn = typeof dns.lookup;
type LookupCallback = (err: NodeJS.ErrnoException | null, address?: unknown, family?: number) => void;
type CacheEntry = { args: unknown[], at: number };

/**
 * dns.lookup with a short cache that is served stale when a fresh lookup fails, and a warning for slow lookups.
 * The connect timeout covers DNS, so a slow or failing resolver (for example Docker's embedded one) otherwise
 * shows up as a bare "Connect Timeout Error".
 */
export function createCachedLookup(lookupFn: LookupFn = dns.lookup, ttlMs = DNS_TTL_MS) {
  const cache = new Map<string, CacheEntry>();
  return function cachedLookup(hostname: string, options: dns.LookupOptions | number, callback: LookupCallback) {
    const opts = typeof options === 'number' ? { family: options } : options;
    const key = `${hostname}|${opts.family ?? 0}|${opts.all ? 1 : 0}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < ttlMs) {
      process.nextTick(callback, null, ...cached.args);
      return;
    }
    const started = Date.now();
    (lookupFn as unknown as (h: string, o: unknown, cb: LookupCallback) => void)(
      hostname,
      opts,
      (err, ...args: unknown[]) => {
        const took = Date.now() - started;
        if (took >= SLOW_LOOKUP_MS) {
          const outcome = err ? `failed: ${err.code}` : 'succeeded';
          log.warn(F, `DNS lookup for ${hostname} took ${took}ms and ${outcome}`);
        }
        if (err) {
          if (cached) {
            log.warn(F, `DNS lookup for ${hostname} failed (${err.code}), using the cached answer`);
            callback(null, ...(cached.args as [unknown, number?]));
            return;
          }
          callback(err);
          return;
        }
        cache.set(key, { args, at: Date.now() });
        callback(null, ...(args as [unknown, number?]));
      },
    );
  };
}

export function createDiscordAgent(): Agent {
  return new Agent({
    connect: {
      timeout: CONNECT_TIMEOUT_MS,
      autoSelectFamily: true,
      autoSelectFamilyAttemptTimeout: AUTO_SELECT_FAMILY_ATTEMPT_TIMEOUT_MS,
      lookup: createCachedLookup() as never,
    },
  });
}

type MakeRequest = (url: string, init: never) => Promise<unknown>;

const sleep = (ms: number) => new Promise<void>(resolve => { setTimeout(resolve, ms); });

export class DiscordRestNetworkError extends Error {
  code?: string;

  constructor(message: string, cause: unknown) {
    super(message, { cause });
    this.name = 'DiscordRestNetworkError';
    const code = (cause as { code?: string } | undefined)?.code;
    if (code) this.code = code;
  }
}

/**
 * discord.js only retries ECONNRESET and aborts. A connect timeout or DNS failure means the request never left,
 * so any method is safe to retry. Failures name the call and the addresses tried.
 */
export function withConnectRetry<T extends MakeRequest>(
  base: T,
  { retries = MAX_CONNECT_RETRIES, delayMs = RETRY_BASE_DELAY_MS, wait = sleep } = {},
): T {
  return (async (url: string, init: { method?: string, signal?: AbortSignal | null }) => {
    const call = `${(init?.method ?? 'GET').toUpperCase()} ${redactDiscordUrl(url)}`;
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await (base as MakeRequest)(url, init as never); // eslint-disable-line no-await-in-loop
      } catch (err) {
        if (!isPreSendFailure(err)) throw err;
        const detail = describeError(err);
        if (attempt >= retries || init?.signal?.aborted) {
          log.warn(F, `Discord REST ${call} failed, giving up after ${attempt + 1} attempts: ${detail}`);
          throw new DiscordRestNetworkError(`${call} failed after ${attempt + 1} attempts: ${detail}`, err);
        }
        const delay = delayMs * 2 ** attempt + Math.floor(Math.random() * delayMs);
        log.warn(F, `Discord REST ${call} failed (attempt ${attempt + 1}), retrying in ${delay}ms: ${detail}`);
        await wait(delay); // eslint-disable-line no-await-in-loop
      }
    }
  }) as unknown as T;
}

/** Wraps the client's REST request function. Call once after creating the Client. */
export function installRestRetry(rest: REST): void {
  const wrapped = withConnectRetry(rest.options.makeRequest as unknown as MakeRequest);
  rest.options.makeRequest = wrapped as never; // eslint-disable-line no-param-reassign
}
