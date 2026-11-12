import { registerEvents } from '../../events/index';

const mocks = vi.hoisted(() => ({
  readdir: vi.fn(), put: vi.fn(), validate: vi.fn(), readFile: vi.fn(), writeFile: vi.fn(),
}));

vi.mock('module-alias/register', () => ({}));
vi.mock('fs/promises', () => ({
  default: { readdir: mocks.readdir, readFile: mocks.readFile, writeFile: mocks.writeFile },
  readdir: mocks.readdir,
}));
vi.mock('../../../global/utils/env.validate', () => ({ default: mocks.validate }));
vi.mock('discord.js', async importOriginal => ({
  ...(await importOriginal<object>()),
  REST: class {
    setToken() { return this; }

    put = mocks.put;
  },
}));

const e = env as unknown as Record<string, string>;

describe('deployCommands', () => {
  async function load() {
    vi.resetModules();
    return (await import('../../utils/commandDeploy')).default;
  }

  beforeEach(() => {
    mocks.readdir.mockResolvedValue(['index.ts', 'readme.md']);
    mocks.put.mockResolvedValue(undefined);
    mocks.readFile.mockRejectedValue(new Error('ENOENT'));
    mocks.writeFile.mockResolvedValue(undefined);
  });

  it('does nothing when the environment is not configured', async () => {
    mocks.validate.mockReturnValue(false);
    const deploy = await load();
    expect(await deploy()).toEqual({ globalCommands: [], guildCommands: [] });
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it('registers global and guild commands with Discord', async () => {
    mocks.validate.mockReturnValue(true);
    const deploy = await load();
    expect(await deploy()).toEqual({ globalCommands: [], guildCommands: [] });
    expect(mocks.put).toHaveBeenCalledTimes(2);
    expect(mocks.put.mock.calls.map(c => String(c[0]))).toEqual(expect.arrayContaining([
      expect.stringContaining('/commands'), expect.stringContaining(`/guilds/${e.DISCORD_GUILD_ID}/commands`),
    ]));
  });

  it('exits the process when registration fails', async () => {
    mocks.validate.mockReturnValue(true);
    mocks.put.mockRejectedValue(new Error('invalid token'));
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const deploy = await load();
    await deploy();
    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
    log.mockRestore();
  });

  describe('on bot start', () => {
    const start = { skipIfUnchanged: true, exitOnError: false };

    it('registers and remembers the definitions when nothing was deployed before', async () => {
      mocks.validate.mockReturnValue(true);
      const deploy = await load();
      await deploy(start);
      expect(mocks.put).toHaveBeenCalledTimes(2);
      expect(mocks.writeFile).toHaveBeenCalledOnce();
    });

    it('skips registration when the definitions match the last deploy', async () => {
      mocks.validate.mockReturnValue(true);
      const deploy = await load();
      await deploy(start);
      const hash = mocks.writeFile.mock.calls[0][1] as string;
      mocks.put.mockClear();
      mocks.readFile.mockResolvedValueOnce(hash);
      await deploy(start);
      expect(mocks.put).not.toHaveBeenCalled();
    });

    it('re-registers when the stored hash differs', async () => {
      mocks.validate.mockReturnValue(true);
      mocks.readFile.mockResolvedValueOnce('stale');
      const deploy = await load();
      await deploy(start);
      expect(mocks.put).toHaveBeenCalledTimes(2);
    });

    it('does not exit the process or save the hash when registration fails', async () => {
      mocks.validate.mockReturnValue(true);
      mocks.put.mockRejectedValue(new Error('invalid token'));
      const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
      const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      const deploy = await load();
      await deploy(start);
      expect(exit).not.toHaveBeenCalled();
      expect(mocks.writeFile).not.toHaveBeenCalled();
      exit.mockRestore();
      log.mockRestore();
    });

    it('ignores a failure to save the hash', async () => {
      mocks.validate.mockReturnValue(true);
      mocks.writeFile.mockRejectedValue(new Error('EACCES'));
      const deploy = await load();
      await expect(deploy(start)).resolves.toBeDefined();
    });
  });

  it('deploys on import when asked to via argv', async () => {
    mocks.validate.mockReturnValue(false);
    const original = process.argv;
    process.argv = [...original, 'deployCommands'];
    await load();
    process.argv = original;
    expect(mocks.validate).toHaveBeenCalled();
  });
});

describe('registerEvents', () => {
  it('ignores non-event files', async () => {
    mocks.readdir.mockResolvedValue(['index.ts', 'notes.md']);
    const client = { on: vi.fn(), once: vi.fn() };
    await registerEvents(client as never);
    expect(client.on).not.toHaveBeenCalled();
    expect(client.once).not.toHaveBeenCalled();
  });
});
