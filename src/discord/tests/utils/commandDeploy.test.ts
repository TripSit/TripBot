import { Routes } from 'discord-api-types/v10';
import { createRequire } from 'node:module';
import path from 'node:path';
import deployCommands from '../../utils/commandDeploy';

const mocks = vi.hoisted(() => ({
  readdir: vi.fn(),
  validate: vi.fn(),
  setToken: vi.fn(),
  put: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock('fs/promises', () => ({ default: { readdir: mocks.readdir, readFile: mocks.readFile, writeFile: mocks.writeFile } }));
vi.mock('../../../global/utils/env.validate', () => ({ default: mocks.validate }));
vi.mock('../../../global/utils/log', () => ({ log: { info: vi.fn(), error: vi.fn() } }));
vi.mock('discord.js', async importOriginal => ({
  ...await importOriginal<typeof import('discord.js')>(),
  REST: class {
    setToken = mocks.setToken;
  },
}));

beforeEach(() => {
  mocks.validate.mockReturnValue(true);
  mocks.readdir.mockResolvedValue(['index.ts', 'README.md']);
  mocks.setToken.mockReturnValue({ put: mocks.put });
  mocks.put.mockResolvedValue(undefined);
  mocks.readFile.mockRejectedValue(new Error('ENOENT'));
  mocks.writeFile.mockResolvedValue(undefined);
});

it('skips command discovery and registration without Discord configuration', async () => {
  mocks.validate.mockReturnValue(false);
  await expect(deployCommands()).resolves.toEqual({ globalCommands: [], guildCommands: [] });
  expect(mocks.readdir).not.toHaveBeenCalled();
  expect(mocks.put).not.toHaveBeenCalled();
});

it('registers the filtered command lists at separate global and guild routes', async () => {
  await expect(deployCommands()).resolves.toEqual({ globalCommands: [], guildCommands: [] });
  expect(mocks.readdir).toHaveBeenCalledWith(expect.stringMatching(/commands\/global$/));
  expect(mocks.readdir).toHaveBeenCalledWith(expect.stringMatching(/commands\/guild$/));
  expect(mocks.put).toHaveBeenCalledTimes(2);
  expect(mocks.put).toHaveBeenCalledWith(Routes.applicationCommands(env.DISCORD_CLIENT_ID.toString()), { body: [] });
  expect(mocks.put).toHaveBeenCalledWith(
    Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID.toString(), env.DISCORD_GUILD_ID),
    { body: [] },
  );
});

it('exits with failure when registration rejects', async () => {
  const error = new Error('Registration rejected');
  mocks.put.mockRejectedValueOnce(error);
  const exit = vi.spyOn(process, 'exit').mockImplementation(() => { throw error; });
  const logError = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  try {
    await expect(deployCommands()).rejects.toBe(error);
    expect(exit).toHaveBeenCalledWith(1);
    expect(logError).toHaveBeenCalledWith(error);
  } finally {
    exit.mockRestore();
    logError.mockRestore();
  }
});

it('serializes command exports and warns about modules without command data', async () => {
  const load = createRequire(__filename);
  const files = ['d.drug.ts', 'd.setup.ts'];
  const paths = files.map(file => load.resolve(path.join(__dirname, '../../commands/global', file)));
  const previousEntries = paths.map(file => load.cache[file]);
  const toJSON = vi.fn(() => ({ name: 'example' }));
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  try {
    const exports = [{ ignored: null, command: { data: { toJSON } } }, { helper: () => undefined }];
    paths.forEach((file, index) => {
      load.cache[file] = { exports: exports[index], loaded: true } as NodeModule;
    });
    mocks.readdir.mockResolvedValueOnce(files);

    await expect(deployCommands()).resolves.toEqual({
      globalCommands: [{ name: 'example' }], guildCommands: [],
    });
    expect(toJSON).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Skipping global/d.setup.ts'));
    expect(mocks.put).toHaveBeenCalledWith(
      Routes.applicationCommands(env.DISCORD_CLIENT_ID.toString()),
      { body: [{ name: 'example' }] },
    );
  } finally {
    paths.forEach((file, index) => {
      const entry = previousEntries[index];
      if (entry) load.cache[file] = entry;
      else delete load.cache[file];
    });
    warn.mockRestore();
  }
});

describe('deploy on bot start', () => {
  it('registers and remembers the definitions when nothing was deployed before', async () => {
    await deployCommands({ skipIfUnchanged: true, exitOnError: false });
    expect(mocks.put).toHaveBeenCalledTimes(2);
    expect(mocks.writeFile).toHaveBeenCalledOnce();
  });

  it('skips registration when the definitions match the last deploy', async () => {
    await deployCommands({ skipIfUnchanged: true, exitOnError: false });
    const hash = mocks.writeFile.mock.calls[0][1] as string;
    mocks.put.mockClear();
    mocks.readFile.mockResolvedValueOnce(hash);
    await deployCommands({ skipIfUnchanged: true, exitOnError: false });
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it('re-registers when the stored hash differs', async () => {
    mocks.readFile.mockResolvedValueOnce('stale');
    await deployCommands({ skipIfUnchanged: true, exitOnError: false });
    expect(mocks.put).toHaveBeenCalledTimes(2);
  });

  it('does not exit the process or save the hash when registration fails', async () => {
    mocks.put.mockRejectedValue(new Error('Registration rejected'));
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      await expect(deployCommands({ skipIfUnchanged: true, exitOnError: false })).resolves.toBeDefined();
      expect(exit).not.toHaveBeenCalled();
      expect(mocks.writeFile).not.toHaveBeenCalled();
    } finally {
      exit.mockRestore();
      consoleLog.mockRestore();
      mocks.put.mockResolvedValue(undefined);
    }
  });
});
