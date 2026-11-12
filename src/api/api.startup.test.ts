import { EventEmitter } from 'node:events';

const { listen } = vi.hoisted(() => ({ listen: vi.fn() }));
vi.mock('./app', () => ({ default: { listen } }));

describe('API startup', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('env', { ...env, API_PORT: undefined });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('uses port 1337 and localhost in the startup log when configuration is absent', async () => {
    vi.stubEnv('DNS_DOMAIN', undefined);
    const info = vi.spyOn(log, 'info');
    const server = new EventEmitter();
    listen.mockImplementationOnce((_port: number, _host: string, onListening: () => void) => {
      queueMicrotask(onListening);
      return server;
    });
    const { default: api } = await import('./api');

    await expect(api()).resolves.toBe(server);
    expect(listen).toHaveBeenCalledExactlyOnceWith(1337, '0.0.0.0', expect.any(Function));
    expect(info).toHaveBeenCalledWith(expect.anything(), 'Listening at http://api.localhost:1337');
  });

  it('rejects with the original listener error', async () => {
    const error = new Error('Could not bind');
    const server = new EventEmitter();
    listen.mockReturnValueOnce(server);
    const { default: api } = await import('./api');

    const startup = api();
    server.emit('error', error);
    await expect(startup).rejects.toBe(error);
  });
});
