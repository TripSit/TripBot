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

describe('handleError details and process listeners', () => {
  it('includes the cause chain in the reported stack', async () => {
    env.NODE_ENV = 'development';
    const interaction = { replied: false, deferred: true, editReply: vi.fn().mockResolvedValue(undefined) };
    const failure = new Error('outer failure', { cause: new Error('inner cause') });
    await handleError(failure, 'ping', interaction as never);
    const embed = (interaction.editReply.mock.calls[0][0] as { embeds: Array<{ data: { description: string } }> }).embeds[0].data;
    expect(embed.description).toContain('Cause: inner cause');
  });

  it('reports non-Error values as JSON, including API errors', async () => {
    env.NODE_ENV = 'development';
    const interaction = { replied: false, deferred: true, editReply: vi.fn().mockResolvedValue(undefined) };
    await handleError({ code: 1 }, 'ping', interaction as never);
    const embed = (interaction.editReply.mock.calls[0][0] as { embeds: Array<{ data: { description: string } }> }).embeds[0].data;
    expect(embed.description).toContain('"code": 1');
    const api = new DiscordAPIError({ code: 50013, message: 'Missing Permissions' } as never, 50013, 403, 'GET', 'url', {} as never);
    await expect(handleError(api, 'ping', interaction as never)).resolves.toBeUndefined();
  });

  it('routes unhandled rejections and uncaught exceptions through handleError', async () => {
    env.NODE_ENV = 'development';
    const before = {
      rejection: process.listeners('unhandledRejection'),
      exception: process.listeners('uncaughtException'),
    };
    vi.resetModules();
    const { error } = await import('../../events/error');
    const added = {
      rejection: process.listeners('unhandledRejection').filter(l => !before.rejection.includes(l)),
      exception: process.listeners('uncaughtException').filter(l => !before.exception.includes(l)),
    };
    try {
      expect(added.rejection).toHaveLength(1);
      expect(added.exception).toHaveLength(1);
      await (added.rejection[0] as (e: Error) => Promise<void>)(new Error('async failure'));
      await (added.exception[0] as (e: Error) => Promise<void>)(new Error('sync failure'));
      await error.execute(new Error('client error') as never);
    } finally {
      added.rejection.forEach(l => process.removeListener('unhandledRejection', l as never));
      added.exception.forEach(l => process.removeListener('uncaughtException', l as never));
    }
  });
});
