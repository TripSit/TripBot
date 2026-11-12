import drugJsonData from '../../../../assets/data/tripsitDB.json';
import comboJsonData from '../../../../assets/data/tripsitCombos.json';
import { combo } from '../../commands/g.combo';

const interactionCategoryA = async (a: string, b = 'mdma') => ((await combo(a, b)) as { interactionCategoryA?: string }).interactionCategoryA;

describe('combo name normalisation', () => {
  it.each([
    ['doz', 'dox'], ['2c-q', '2c-x'], ['2c-t-9', '2c-t-x'], ['5-meo-abt', '5-meo-xxt'], ['gbl', 'ghb/gbl'], ['snri', 'ssris'], ['snris', 'ssris'], ['maoi', 'maois'],
  ])('maps %s to %s', async (input, key) => {
    expect(await interactionCategoryA(input)).toBe(key);
  });

  // Regression test for TripSit/TripBot#1329: the NBOMe regex used to be duplicated, so these resolved to 2c-t-x.
  it('maps 25x-NBOMe substances to the nbomes interaction data', async () => {
    expect(await interactionCategoryA('25q-nbome')).toBe('nbomes');
  });

  it('maps unknown amphetamine names to the amphetamines category', async () => {
    expect(await interactionCategoryA('imaginary-amphetamine')).toBe('amphetamines');
  });

  it('resolves every bundled substance without throwing, covering the category fallbacks', async () => {
    const names = Object.keys(drugJsonData);
    const results = await Promise.all(names.map(async name => combo(name, 'mdma')));
    expect(results).toHaveLength(names.length);
    const categories = new Set(results.map(r => (r as { interactionCategoryA?: string }).interactionCategoryA));
    expect(categories.has('benzodiazepines')).toBe(true);
    expect(categories.has('opioids')).toBe(true);
  });

  it('finds combo data stored on the second drug', async () => {
    const names = Object.keys(drugJsonData);
    const results = await Promise.all(names.slice(0, 150).map(async name => combo('mdma', name)));
    expect(results.some(r => 'result' in r)).toBe(true);
  });

  it('resolves aliases to their canonical drug', async () => {
    expect(await interactionCategoryA('bd')).toBe(await interactionCategoryA('1,4-butanediol'));
  });

  it('falls back to the other drug\'s combo list when the first has no entry', async () => {
    const names = Object.keys(drugJsonData).slice(0, 70);
    const pairs = names.flatMap(a => names.map(b => [a, b] as const));
    const results = await Promise.all(pairs.map(async ([a, b]) => combo(a, b)));
    expect(results.filter(r => 'result' in r).length).toBeGreaterThan(0);
  });

  it('uses the second drug\'s entry when only that side lists the interaction', async () => {
    const categories = Object.keys(comboJsonData);
    const results = await Promise.all(categories.flatMap(a => categories.map(async b => combo(a, b))));
    expect(results.filter(r => 'result' in r).length).toBeGreaterThan(0);
  });
});
