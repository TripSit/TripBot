/* eslint-disable max-len, sonarjs/no-duplicate-string */
import { dCalc } from '../../commands/global/d.calc';
import { slashStub } from '../../../vitest/utils/commandStubs';

const mocks = vi.hoisted(() => ({
  benzo: vi.fn(), dxm: vi.fn(), ketamine: vi.fn(), mdma: vi.fn(), opioid: vi.fn(), psy: vi.fn(), solvent: vi.fn(), substance: vi.fn(),
}));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/commands/g.calc', () => ({
  calcBenzo: mocks.benzo,
  calcDxm: mocks.dxm,
  calcKetamine: mocks.ketamine,
  calcMDMA: mocks.mdma,
  calcOpioid: mocks.opioid,
  calcPsychedelics: mocks.psy,
  calcSolvent: mocks.solvent,
  calcSubstance: mocks.substance,
}));

type EmbedData = { title?: string; description?: string; fields?: Array<{ name: string; value: string }> };
const run = async (subcommand: string, options: Record<string, unknown>) => {
  const stub = slashStub({ subcommand, options });
  const result = await dCalc.execute(stub as never);
  const embed = (stub.editReply.mock.calls[0][0] as { embeds: Array<{ data: EmbedData }> }).embeds[0].data;
  return { result, embed };
};

describe('calc', () => {
  it('benzo converts and validates', async () => {
    mocks.benzo.mockResolvedValue(2);
    const ok = await run('benzo', { i_have: 1, mg_of: 'a', and_i_want_the_dose_of: 'b' });
    expect(ok.embed.title).toBe('1 mg of a about equal to 2 mg of b');
    const low = await run('benzo', { i_have: 0.0001, mg_of: 'a', and_i_want_the_dose_of: 'b' });
    expect(low.embed.title).toBe('Invalid values supplied');
    mocks.benzo.mockResolvedValue(-1);
    expect((await run('benzo', { i_have: 1, mg_of: 'a', and_i_want_the_dose_of: 'b' })).embed.title).toBe('Error!');
  });

  it('dxm lays out plateaus', async () => {
    mocks.dxm.mockResolvedValue({ units: 'mg', data: { First: { min: 1, max: 2 }, Second: { min: 3, max: 4 } } });
    const { embed } = await run('dxm', { calc_weight: 70, units: 'kg', taking: 'Pure (mg)' });
    expect(embed.fields).toHaveLength(6);
    expect(embed.fields?.[0].name).toBe('Plateau');
    expect(embed.fields?.[3].name).toBe('​');
    expect((await run('dxm', { calc_weight: 0, units: 'kg', taking: 'x' })).embed.title).toBe('Invalid values supplied');
  });

  it('ketamine enforces weight bounds per unit', async () => {
    mocks.ketamine.mockResolvedValue({ insufflated: '10mg' });
    expect((await run('ketamine', { weight: 200, units: 'kg' })).embed.title).toContain('179 kg');
    expect((await run('ketamine', { weight: 400, units: 'lbs' })).embed.title).toContain('398 lbs');
    expect((await run('ketamine', { weight: 70, units: 'kg' })).embed.fields?.[0].value).toBe('10mg');
  });

  it('mdma lists doses and the 150mg warning', async () => {
    mocks.mdma.mockResolvedValue({ light: '50mg', common: '80mg' });
    const { embed } = await run('mdma', { weight: 70, units: 'kg' });
    expect(embed.description).toContain('**Light**: 50mg');
    expect(embed.description).toContain('150mg');
    expect((await run('mdma', { weight: 0, units: 'kg' })).embed.title).toBe('Invalid values supplied');
  });

  it('nasal computes solvent or substance', async () => {
    mocks.solvent.mockResolvedValue(5);
    mocks.substance.mockResolvedValue(7);
    const base = { amount: 1, desired_mg_per_push: 1, ml_per_push: 1 };
    expect((await run('nasal', { ...base, calculation_type: 'solvent' })).embed.description).toContain('5ml');
    expect((await run('nasal', { ...base, calculation_type: 'substance' })).embed.description).toContain('7mg');
    expect((await run('nasal', { ...base, calculation_type: 'other' })).embed.description).toBeUndefined();
    expect((await run('nasal', { ...base, amount: 0, calculation_type: 'solvent' })).embed.title).toBe('Invalid values supplied');
  });

  it('psychedelics reports needed dose', async () => {
    mocks.psy.mockResolvedValue(150);
    const base = { last_dose_amount: 100, desired_dose_amount: 100, days: 3 };
    expect((await run('psychedelics', { ...base, drug_type: 'lsd' })).embed.title).toContain('150 ug of LSD');
    expect((await run('psychedelics', { ...base, drug_type: 'mushrooms' })).embed.title).toContain('Mushrooms');
    expect((await run('psychedelics', { ...base, days: 0, drug_type: 'lsd' })).embed.title).toBe('Invalid values supplied');
  });

  describe('opioid', () => {
    const drug = (name: string, extra = {}) => ({ name, potency: { oral: [1, 1], parenteral: [2, 2] }, ...extra });
    const result = (over = {}) => ({
      ok: true,
      from: drug('Codeine', { pharmacology: 'partial-agonist', notes: ['from note'] }),
      to: drug('Fentanyl', {
        onset: '5m', duration: '2h', halfLife: '3h', notes: ['n1', 'n2', 'n3'], pharmacology: 'kappa-agonist',
      }),
      fromRoute: 'oral',
      toRoute: 'parenteral',
      morphineEquivalent: [10, 10],
      equianalgesic: [0.05, 0.05],
      cautiousStart: true,
      otherRoutes: [{ roa: 'oral', dose: [1, 1], estimated: true }, { roa: 'intranasal', dose: [2, 2], estimated: false }],
      sameDrug: false,
      ...over,
    });
    const opts = (detail: string) => ({
      i_have: 30, mg_of: 'a', and_i_want_the_dose_of: 'b', level_of_detail: detail,
    });

    it('shows an error embed when conversion fails', async () => {
      mocks.opioid.mockResolvedValueOnce({ ok: false, message: 'unknown opioid' });
      const { embed } = await run('opioid', opts('detailed'));
      expect(embed.title).toBe('I could not run that conversion');
      expect(embed.description).toContain('unknown opioid');
    });

    it('short level of detail only adds the closing warning', async () => {
      mocks.opioid.mockResolvedValueOnce(result());
      const { embed } = await run('opioid', opts('short'));
      expect(embed.fields).toHaveLength(1);
      expect(embed.fields?.[0].value).toContain('naloxone');
    });

    it('detailed output includes routes, timing, weighing and notes', async () => {
      mocks.opioid.mockResolvedValueOnce(result());
      const { embed } = await run('opioid', opts('detailed'));
      const names = embed.fields?.map(f => f.name);
      expect(embed.description).toContain('Converted via');
      expect(embed.description).toContain('Start low');
      expect(names).toEqual(expect.arrayContaining(['Other routes for Fentanyl', 'Onset', 'Duration', 'Half-life', 'Weight Considerations', 'Worth knowing']));
      // notes are capped at three
      expect(embed.fields?.find(f => f.name === 'Worth knowing')?.value.split('\n')).toHaveLength(4);
      expect(embed.fields?.find(f => f.name === 'Other routes for Fentanyl')?.value).toContain('estimated from bioavailability');
    });

    it('handles morphine endpoints, assumed routes and missing data', async () => {
      mocks.opioid.mockResolvedValueOnce(result({
        from: { name: 'Morphine', potency: {} },
        to: { name: 'Morphine', potency: {}, defaultRoute: 'oral' },
        equianalgesic: [5, 5],
        cautiousStart: false,
        otherRoutes: [],
        sameDrug: true,
      }));
      const { embed } = await run('opioid', opts('detailed'));
      expect(embed.description).not.toContain('Converted via');
      expect(embed.description).toContain('unknown');
      expect(embed.fields?.find(f => f.name === 'Other routes for Morphine')).toBeUndefined();
    });

    it('clips oversize titles and fields, and respects the embed budget', async () => {
      const long = 'x'.repeat(2000);
      mocks.opioid.mockResolvedValueOnce(result({
        from: drug('N'.repeat(300)),
        to: drug('Fentanyl', {
          onset: long, duration: long, halfLife: long, notes: [long, long, long],
        }),
      }));
      const { embed } = await run('opioid', opts('detailed'));
      expect((embed.title ?? '').length).toBeLessThanOrEqual(256);
      expect(embed.fields?.every(f => f.value.length <= 1024)).toBe(true);
    });
  });

  it('unknown subcommand returns an error embed', async () => {
    const stub = slashStub({ subcommand: 'zzz' });
    expect(await dCalc.execute(stub as never)).toBe(false);
    expect(stub.editReply).toHaveBeenCalled();
  });
});
