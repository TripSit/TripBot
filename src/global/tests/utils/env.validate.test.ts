import validateEnv from '../../utils/env.validate';

const KEYS = [
  'TELEGRAM_TOKEN', 'DISCORD_GUILD_ID', 'DISCORD_OWNER_ID', 'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_TOKEN',
  'PRISMA_DB_URL', 'MATRIX_ACCESS_TOKEN', 'GITHUB_TOKEN', 'RAPID_TOKEN', 'IMGUR_ID', 'IMGUR_SECRET',
  'YOUTUBE_TOKEN', 'IMDB_TOKEN',
];
const saved: Record<string, string | undefined> = {};

const discordEnv = {
  DISCORD_GUILD_ID: '1', DISCORD_OWNER_ID: '2', DISCORD_CLIENT_ID: '3', DISCORD_CLIENT_TOKEN: 'tok', PRISMA_DB_URL: 'db',
};

function setEnv(values: Record<string, string>) {
  Object.assign(process.env, values);
}

describe('validateEnv', () => {
  beforeEach(() => {
    KEYS.forEach(k => { saved[k] = process.env[k]; delete process.env[k]; });
  });
  afterEach(() => {
    KEYS.forEach(k => {
      if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k];
    });
  });

  it('requires a telegram token', () => {
    expect(validateEnv('TELEGRAM')).toBe(false);
    setEnv({ TELEGRAM_TOKEN: 't' });
    expect(validateEnv('TELEGRAM')).toBe(true);
  });

  it('requires a matrix token', () => {
    expect(validateEnv('MATRIX')).toBe(false);
    setEnv({ MATRIX_ACCESS_TOKEN: 't' });
    expect(validateEnv('MATRIX')).toBe(true);
  });

  it.each(['DISCORD_GUILD_ID', 'DISCORD_CLIENT_ID', 'DISCORD_CLIENT_TOKEN', 'PRISMA_DB_URL'])('fails discord validation without %s', missing => {
    setEnv(discordEnv);
    Reflect.deleteProperty(process.env, missing);
    expect(validateEnv('DISCORD')).toBe(false);
  });

  it('passes with a full discord config and only warns about the owner id', () => {
    setEnv(discordEnv);
    expect(validateEnv('DISCORD')).toBe(true);
    Reflect.deleteProperty(process.env, 'DISCORD_OWNER_ID');
    expect(validateEnv('DISCORD')).toBe(true);
  });

  it('rejects the placeholder discord token', () => {
    setEnv({ ...discordEnv, DISCORD_CLIENT_TOKEN: 'In your Discord Developer Portal' });
    expect(validateEnv('DISCORD')).toBe(false);
  });

  it('only warns for missing service tokens', () => {
    expect(validateEnv('SERVICES')).toBe(true);
    setEnv({
      GITHUB_TOKEN: 'a', RAPID_TOKEN: 'b', IMGUR_ID: 'c', IMGUR_SECRET: 'd', YOUTUBE_TOKEN: 'e', IMDB_TOKEN: 'f',
    });
    expect(validateEnv('SERVICES')).toBe(true);
  });

  it('passes for IRC', () => {
    expect(validateEnv('IRC')).toBe(true);
  });
});
