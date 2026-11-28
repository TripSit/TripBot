import requireGuildId from '../../utils/requireGuildId';

describe('requireGuildId', () => {
  const original = process.env.DISCORD_GUILD_ID;
  afterEach(() => {
    if (original === undefined) delete process.env.DISCORD_GUILD_ID;
    else process.env.DISCORD_GUILD_ID = original;
  });

  it('returns the configured guild id', () => {
    process.env.DISCORD_GUILD_ID = 'guild-1';
    expect(requireGuildId()).toBe('guild-1');
  });

  it('throws when the guild id is missing or empty', () => {
    delete process.env.DISCORD_GUILD_ID;
    expect(() => requireGuildId()).toThrow('DISCORD_GUILD_ID is not configured');
    process.env.DISCORD_GUILD_ID = '';
    expect(() => requireGuildId()).toThrow('DISCORD_GUILD_ID is not configured');
  });
});
