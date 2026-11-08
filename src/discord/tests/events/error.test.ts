import { DiscordAPIError } from 'discord.js';
import handleError from '../../events/error';

const originalEnv = env.NODE_ENV;
const originalClient = global.discordClient;
const unhealthy = () => new Error('Connect Timeout Error (attempted address: discord.com:443, timeout: 10000ms)');

beforeEach(() => {
  env.NODE_ENV = 'production';
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  env.NODE_ENV = originalEnv;
  global.discordClient = originalClient;
  vi.restoreAllMocks();
});

describe('handleError', () => {
  it('does not throw or fetch anything when Discord is not ready', async () => {
    const fetch = vi.fn();
    global.discordClient = { isReady: () => false, channels: { fetch } } as never;
    await expect(handleError(unhealthy())).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('swallows a failing report and still answers the interaction', async () => {
    global.discordClient = {
      isReady: () => true,
      channels: { fetch: vi.fn().mockRejectedValue(unhealthy()) },
    } as never;
    const interaction = { replied: false, deferred: true, editReply: vi.fn().mockResolvedValue(undefined) };
    await expect(handleError(new Error('unique failure one'), 'ping', interaction as never)).resolves.toBeUndefined();
    expect(interaction.editReply).toHaveBeenCalledTimes(1);
  });

  it('does not throw when answering the interaction fails too', async () => {
    global.discordClient = { isReady: () => false } as never;
    const interaction = { replied: true, deferred: false, editReply: vi.fn().mockRejectedValue(unhealthy()) };
    await expect(handleError(new Error('unique failure two'), 'ping', interaction as never)).resolves.toBeUndefined();
  });

  it('does not throw on an error it cannot serialise', async () => {
    global.discordClient = { isReady: () => false } as never;
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    await expect(handleError(circular)).resolves.toBeUndefined();
  });

  it('suppresses a repeated identical report', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    global.discordClient = {
      isReady: () => true,
      channels: { fetch: vi.fn().mockResolvedValue({ send }) },
      guilds: { fetch: vi.fn().mockResolvedValue({ roles: { fetch: vi.fn().mockResolvedValue('<@&1>') } }) },
    } as never;
    const err = new DiscordAPIError({ message: 'x', code: 10062 }, 10062, 404, 'get', '/x', {} as never);
    await handleError(err);
    await handleError(err);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
