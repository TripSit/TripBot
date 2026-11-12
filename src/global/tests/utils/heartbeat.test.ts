import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { isHealthy } from '../../utils/heartbeat';

const original = {
  DISCORD_CLIENT_TOKEN: env.DISCORD_CLIENT_TOKEN,
  IRC_PASSWORD: env.IRC_PASSWORD,
};

beforeEach(() => {
  env.DISCORD_CLIENT_TOKEN = 'token';
  env.IRC_PASSWORD = 'password';
});

afterEach(() => {
  Object.assign(env, original);
  global.discordClient = undefined as unknown as typeof global.discordClient;
  global.ircClient = undefined;
  vi.restoreAllMocks();
});

describe('isHealthy', () => {
  it('is unhealthy when Discord is configured but not ready', () => {
    global.discordClient = { isReady: () => false } as unknown as typeof global.discordClient;
    expect(isHealthy()).toBe(false);
  });

  it('is unhealthy when IRC is configured but not connected', () => {
    global.discordClient = { isReady: () => true } as unknown as typeof global.discordClient;
    global.ircClient = { connected: false } as unknown as typeof global.ircClient;
    expect(isHealthy()).toBe(false);
  });

  it('is healthy when every configured connection is up', () => {
    global.discordClient = { isReady: () => true } as unknown as typeof global.discordClient;
    global.ircClient = { connected: true } as unknown as typeof global.ircClient;
    expect(isHealthy()).toBe(true);
  });

  it('ignores connections that are not configured', () => {
    env.DISCORD_CLIENT_TOKEN = undefined as unknown as string;
    env.IRC_PASSWORD = undefined as unknown as string;
    expect(isHealthy()).toBe(true);
  });
});
