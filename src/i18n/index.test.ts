import { ChatInputCommandInteraction } from 'discord.js';
import {
  getCommandLocalizations,
  getLocale,
  initI18n, t,
} from './index';

beforeAll(async () => {
  (global as NodeJS.Global & { env: { LOCALE: string } }).env = { LOCALE: 'en-US' };
  await initI18n();
});

describe('t()', () => {
  it('returns correct English string for known key', () => {
    expect(t('en-US', 'drug', 'aliases')).toBe('Aliases');
  });

  it('interpolates variables correctly', () => {
    expect(t('en-US', 'drug', 'toleranceFull', { value: 'Rapidly' })).toBe('Full: Rapidly');
  });

  it('returns Finnish string when locale is fi', () => {
    expect(t('fi', 'drug', 'tolerance')).toBe('↗ Toleranssi');
  });

  it('returns the key name when missing from all languages', () => {
    expect(t('en-US', 'drug', 'nonExistentKey')).toBe('nonExistentKey');
  });
});

describe('getLocale()', () => {
  const makeInteraction = (guildId: string | null) => ({ guildId } as unknown as ChatInputCommandInteraction);

  type GlobalWithDb = NodeJS.Global & { db: { discord_guilds: { findUnique: jest.Mock } } };

  it('returns env locale when guild has no locale set', async () => {
    (global as GlobalWithDb).db = {
      discord_guilds: { findUnique: jest.fn().mockResolvedValue({ locale: null }) },
    };
    const locale = await getLocale(makeInteraction('guild-123'), 'drug');
    expect(locale).toBe('en-US');
  });

  it('returns guild locale when set', async () => {
    (global as GlobalWithDb).db = {
      discord_guilds: { findUnique: jest.fn().mockResolvedValue({ locale: 'fi' }) },
    };
    const locale = await getLocale(makeInteraction('guild-123'), 'drug');
    expect(locale).toBe('fi');
  });

  it('falls back to env locale when DB throws', async () => {
    (global as GlobalWithDb).db = {
      discord_guilds: { findUnique: jest.fn().mockRejectedValue(new Error('DB down')) },
    };
    const locale = await getLocale(makeInteraction('guild-123'), 'drug');
    expect(locale).toBe('en-US');
  });

  it('returns env locale for DM interactions with no guildId', async () => {
    const locale = await getLocale(makeInteraction(null), 'drug');
    expect(locale).toBe('en-US');
  });
});

describe('getCommandLocalizations()', () => {
  it('returns fi localization for a known key', () => {
    const result = getCommandLocalizations('drug', 'commandName');
    expect(result).toMatchObject({ fi: 'huume' });
  });

  it('returns empty object for an unknown namespace', () => {
    const result = getCommandLocalizations('nonexistent', 'commandName');
    expect(result).toEqual({});
  });
});
