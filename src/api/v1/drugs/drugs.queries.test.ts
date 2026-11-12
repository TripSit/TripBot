import queries from './drugs.queries';

const mocks = vi.hoisted(() => ({ combo: vi.fn() }));
vi.mock('../../../global/commands/g.combo', () => ({ combo: mocks.combo }));

describe('drug queries (legacy v1)', () => {
  it('lists drugs, names, aliases and categories from the bundled data', async () => {
    const all = await queries.getAllDrugs();
    const names = await queries.getAllDrugNames();
    expect(names.length).toBe(Object.keys(all).length);
    const aliases = await queries.getAllDrugAliases();
    expect(aliases.length).toBeGreaterThan(0);
    const categories = await queries.getAllCategories();
    expect(categories).toEqual([...categories].sort());
    expect(new Set(categories).size).toBe(categories.length);
  });

  it('finds drugs by category, tolerating case and plurals', async () => {
    const categories = await queries.getAllCategories();
    const category = categories[0];
    const exact = await queries.getAllDrugNamesByCategory(category);
    expect(Array.isArray(exact)).toBe(true);
    expect(await queries.getAllDrugNamesByCategory(category.toUpperCase())).toEqual(exact);
    expect(await queries.getAllDrugNamesByCategory(`${category}s`)).toEqual(exact);
    const missing = await queries.getAllDrugNamesByCategory('not-a-category');
    expect(missing).toMatchObject({ err: true, options: categories });
  });

  it('looks up a drug case-insensitively and lists options when unknown', async () => {
    const [name] = await queries.getAllDrugNames();
    expect(await queries.getDrug(name.toUpperCase())).toMatchObject({ name: expect.any(String) });
    expect(await queries.getDrug('definitely-not-a-drug')).toMatchObject({ err: true, options: expect.any(Array) });
  });

  it('delegates interactions to the combo command', async () => {
    mocks.combo.mockResolvedValueOnce({ result: 'Safe' });
    expect(await queries.getInteraction('a', 'b')).toEqual({ result: 'Safe' });
    expect(mocks.combo).toHaveBeenCalledWith('a', 'b');
  });
});
