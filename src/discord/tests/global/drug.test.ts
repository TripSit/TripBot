import { dDrug, getDrugInfo } from '../../commands/global/d.drug';
import { slashStub } from '../../../vitest/utils/commandStubs';

const mocks = vi.hoisted(() => ({ drug: vi.fn() }));
vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/commands/g.drug', () => ({ drug: mocks.drug }));

type Fields = Array<{ name: string; value: string }>;
const dataOf = async (name: string, section?: 'all' | 'dosage' | 'summary') => {
  const out = await getDrugInfo(name, section);
  return (out.embeds as Array<{ data: { title?: string; description?: string; fields?: Fields } }>)[0].data;
};

const full = () => ({
  name: 'Foo',
  url: 'https://wiki/Foo',
  summary: 'sum',
  aliases: ['a', 'b'],
  interactions: [{ name: 'X', status: 'Dangerous' }, { name: 'Y', status: 'Caution' }],
  classes: { chemical: 'chem', psychoactive: 'psy' },
  crossTolerances: ['lsd'],
  addictionPotential: 'low',
  tolerance: { full: 'now', half: 'a week', zero: 'a month' },
  toxicity: ['none known'],
  reagents: 'purple',
  experiencesUrl: 'https://erowid',
  roas: [
    { name: 'Oral', dosage: [{ name: 'Light', value: '1mg' }], duration: [{ name: 'Total', value: '4h' }] },
    { name: 'Insufflated', dosage: [{ name: 'Light', value: '1mg' }], duration: [{ name: 'Total', value: '2h' }] },
    { name: 'Smoked', dosage: [{ name: 'Light', value: '1mg' }], duration: [{ name: 'Total', value: '1h' }] },
    { name: 'Vapourised', duration: [{ name: 'Total', value: '1h' }] },
  ],
});

describe('getDrugInfo', () => {
  it('reports a missing substance', async () => {
    mocks.drug.mockResolvedValueOnce(null);
    expect((await dataOf('nope')).title).toBe('nope was not found');
  });

  it('renders every section for a full record', async () => {
    mocks.drug.mockResolvedValueOnce(full());
    const data = await dataOf('foo');
    const names = (data.fields as Fields).map(f => f.name);
    expect(data.title).toContain('Foo');
    expect(names).toEqual(expect.arrayContaining([
      'Aliases', 'ℹ️ Class', '🔀 Cross Tolerances', '💔 Addiction Potential', '↗ Tolerance', '☣ Toxicity', '🔬Reagent Results', 'Links',
    ]));
    // harm-reduction ordering prefers smoked/vapourised/insufflated routes first
    expect(names.find(n => n.startsWith('💊'))).toContain('Smoked');
    expect(names.some(n => n.includes('Dangerous'))).toBe(true);
  });

  it('supports the dosage and summary sections', async () => {
    mocks.drug.mockResolvedValueOnce(full());
    const dosage = await dataOf('foo', 'dosage');
    expect(dosage.fields?.every(f => f.name.startsWith('💊'))).toBe(true);
    mocks.drug.mockResolvedValueOnce(full());
    const summary = await dataOf('foo', 'summary');
    expect(summary.description).toBe('sum');
    expect(summary.fields).toBeUndefined();
  });

  it('copes with sparse records and pads columns', async () => {
    mocks.drug.mockResolvedValueOnce({ name: 'Bare', url: 'https://u', classes: { chemical: 'c' } });
    const bare = await dataOf('bare');
    expect(bare.fields?.some(f => f.name === '​')).toBe(true);
    mocks.drug.mockResolvedValueOnce({
      name: 'Two', url: 'https://u', classes: {}, addictionPotential: 'x', roas: [{ name: 'Oral', duration: [] }],
    });
    expect(await dataOf('two')).toBeDefined();
    mocks.drug.mockResolvedValueOnce({ name: 'NoRoa', url: 'https://u' });
    expect((await dataOf('noroa')).fields).toBeUndefined();
    mocks.drug.mockResolvedValueOnce({ name: 'Dose', url: 'https://u' });
    expect((await dataOf('dose', 'dosage')).fields).toBeUndefined();
  });
});

describe('drug command', () => {
  it('replies with the embed', async () => {
    mocks.drug.mockResolvedValue(full());
    const stub = slashStub({ options: { substance: 'foo', section: 'all', ephemeral: true } });
    expect(await dDrug.execute(stub as never)).toBe(true);
    expect(stub.editReply).toHaveBeenCalled();
  });

  it('falls back to an ephemeral follow-up', async () => {
    mocks.drug.mockResolvedValue(full());
    const stub = slashStub({ options: { substance: 'foo' } });
    stub.editReply.mockRejectedValueOnce(new Error('too big'));
    expect(await dDrug.execute(stub as never)).toBe(true);
    expect(stub.deleteReply).toHaveBeenCalled();
    expect(stub.followUp).toHaveBeenCalledWith(expect.objectContaining({ flags: expect.anything() }));
  });
});
