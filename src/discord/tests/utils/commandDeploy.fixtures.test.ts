export {};

const mocks = vi.hoisted(() => ({ put: vi.fn(), validate: vi.fn() }));

vi.mock('module-alias/register', () => ({}));
vi.mock('../../../global/utils/env.validate', () => ({ default: mocks.validate }));
vi.mock('discord.js', async importOriginal => ({
  ...(await importOriginal<object>()),
  REST: class {
    setToken() { return this; }

    put = mocks.put;
  },
}));
vi.mock('path', async importOriginal => {
  const original = await importOriginal<typeof import('path')>();
  const join = (...parts: string[]) => (
    parts.at(-1) === '../commands' && parts[0].endsWith('discord/utils')
      ? original.join(parts[0], '../tests/fixtures/commands')
      : original.join(...parts)
  );
  return { ...original, default: { ...original, join }, join };
});

describe('deployCommands with real command modules', () => {
  it('loads command modules, skipping files without a SlashCommand export, and registers their JSON', async () => {
    mocks.validate.mockReturnValue(true);
    mocks.put.mockResolvedValue(undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.resetModules();
    const deploy = (await import('../../utils/commandDeploy')).default;
    const result = await deploy();
    expect(result.globalCommands).toEqual([{ name: 'fixture-global' }]);
    expect(result.guildCommands).toEqual([{ name: 'fixture-guild' }]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Skipping global/d.nodata.js'));
    expect(mocks.put).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
