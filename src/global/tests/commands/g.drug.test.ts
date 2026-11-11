import { drug } from '../../commands/g.drug';

describe('drug', () => {
  it('finds a substance by name case-insensitively', async () => {
    const result = await drug('LSD');
    expect(result?.name.toLowerCase()).toBe('lsd');
  });

  it('falls back to aliases', async () => {
    const byName = await drug('lsd');
    const alias = byName?.aliases?.[0];
    expect(alias).toBeDefined();
    const byAlias = await drug(alias as string);
    expect(byAlias?.name).toBe(byName?.name);
  });

  it('returns undefined for unknown substances', async () => {
    expect(await drug('definitely-not-a-drug-xyz')).toBeUndefined();
  });
});
