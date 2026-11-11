import { getDrugInfo } from '../../commands/global/d.drug';

const mocks = vi.hoisted(() => ({ drug: vi.fn() }));
vi.mock('../../../global/commands/g.drug', () => ({ drug: mocks.drug }));

describe('getDrugInfo column filling', () => {
  it('adds tolerance to fill a short first row', async () => {
    mocks.drug.mockResolvedValueOnce({
      name: 'Short', url: 'https://u', classes: { chemical: 'c' }, tolerance: { full: 'now' },
    });
    const out = await getDrugInfo('short');
    const { fields } = (out.embeds as Array<{ data: { fields: Array<{ name: string }> } }>)[0].data;
    expect(fields.map(f => f.name)).toContain('↗ Tolerance');
  });
});
