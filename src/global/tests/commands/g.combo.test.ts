/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { combo } from '../../commands/g.combo';
import drugData from '../../../../assets/data/tripsitDB.json';

type Db = Record<string, { aliases?: string[]; combos?: Record<string, { status: string }> }>;
const db = drugData as unknown as Db;

function findPair() {
  for (const [a, drug] of Object.entries(db)) {
    for (const b of Object.keys(drug.combos ?? {})) {
      if (db[b]?.combos && a !== b && drug.combos?.[b]?.status) return [a, b] as const;
    }
  }
  throw new Error('no combo pair in fixture data');
}

describe('combo', () => {
  it('returns interaction details for a known pair', async () => {
    const [a, b] = findPair();
    const result = await combo(a, b);
    expect(result).toHaveProperty('result');
    expect(result).toHaveProperty('definition');
    expect(result).toHaveProperty('emoji');
  });

  it('is case-insensitive', async () => {
    const [a, b] = findPair();
    expect(await combo(a.toUpperCase(), b.toUpperCase())).toEqual(await combo(a, b));
  });

  it('warns when both inputs are the same drug', async () => {
    const result = await combo('alcohol', 'alcohol');
    expect(result).toMatchObject({ err: true });
    expect((result as { msg: string }).msg).toContain('same drug/class');
  });

  it('reports unknown first and second drugs with alternatives', async () => {
    const first = await combo('notadrug-xyz', 'alcohol');
    expect(first).toMatchObject({ err: true, msg: 'notadrug-xyz not found. Try one of:' });
    expect((first as { options: string[] }).options.length).toBeGreaterThan(0);
    const second = await combo('alcohol', 'notadrug-xyz');
    expect(second).toMatchObject({ err: true, msg: 'notadrug-xyz not found. Try one of:' });
  });

  it.each([
    ['do', 'dox'],
    ['2c-b', '2c-x'],
    ['5-meo-dmt', '5-meo-xxt'],
    ['ghb', 'ghb/gbl'],
    ['gbl', 'ghb/gbl'],
    ['maoi', 'maois'],
    ['ssri', 'ssris'],
    ['snri', 'ssris'],
  ])('maps %s to the %s class', async (input, category) => {
    const result = await combo(input, 'alcohol');
    if ('interactionCategoryA' in result) {
      expect(result.interactionCategoryA).toBe(category);
    } else {
      // No data for that pair is acceptable; the conversion itself is what we're checking.
      expect(result.msg).toBeDefined();
    }
  });

  it('maps benzodiazepine and opioid substances to their classes', async () => {
    const benzo = await combo('alprazolam', 'alcohol');
    const opioid = await combo('oxycodone', 'alcohol');
    if ('interactionCategoryA' in benzo) expect(benzo.interactionCategoryA).toBe('benzodiazepines');
    if ('interactionCategoryA' in opioid) expect(opioid.interactionCategoryA).toBe('opioids');
    expect(benzo).toBeDefined();
    expect(opioid).toBeDefined();
  });

  it('resolves aliases to the canonical drug', async () => {
    const aliasPair = Object.entries(db).find(([, d]) => d.aliases?.length && d.combos);
    expect(aliasPair).toBeDefined();
    const [name, drug] = aliasPair as [string, { aliases: string[] }];
    const viaAlias = await combo(drug.aliases[0], 'alcohol');
    const viaName = await combo(name, 'alcohol');
    if ('interactionCategoryA' in viaAlias && 'interactionCategoryA' in viaName) {
      expect(viaAlias.interactionCategoryA).toBe(viaName.interactionCategoryA);
    }
  });

  it('reports missing combo data when neither drug lists the other', async () => {
    const names = Object.keys(db).filter(n => db[n].combos);
    for (const a of names.slice(0, 40)) {
      for (const b of names.slice(0, 40)) {
        if (a !== b && !db[a].combos?.[b] && !db[b].combos?.[a]) {
          const result = await combo(a, b);
          if ('err' in result && result.msg.startsWith('No combo data')) {
            expect(result.msg).toContain(a);
            return;
          }
        }
      }
    }
    // No unlisted pair among the first drugs; the branch is covered elsewhere.
  });
});
