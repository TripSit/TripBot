import {
  calcBenzo, calcDxm, calcKetamine, calcMDMA, calcOpioid, calcPsychedelics, calcSolvent, calcSubstance,
  generateInsufflatedDosages, generateRectalDosages,
} from '../../commands/g.calc';

describe('calcBenzo', () => {
  it('converts between benzodiazepines via diazepam equivalence', async () => {
    // alprazolam 0.5mg ~= 10mg diazepam; clobazam 20mg ~= 10mg diazepam
    expect(await calcBenzo(1, 'alprazolam', 'clobazam')).toBe(40);
  });

  it('returns -1 for unknown or non-convertible drugs', async () => {
    expect(await calcBenzo(1, 'notadrug', 'clobazam')).toBe(-1);
    expect(await calcBenzo(1, 'alprazolam', 'notadrug')).toBe(-1);
    expect(await calcBenzo(1, 'lsd', 'clobazam')).toBe(-1);
    expect(await calcBenzo(1, 'alprazolam', 'lsd')).toBe(-1);
  });
});

describe('calcDxm', () => {
  it.each([
    ['RoboCough (ml)', '(ml)'],
    ['Robitussin DX (oz)', '(oz)'],
    ['Robitussin DX (ml)', '(ml)'],
    ['Robitussin Gelcaps (15 mg caps)', '(15 mg caps)'],
    ['Pure (mg)', '(mg)'],
    ['30mg Gelcaps (30 mg caps)', '(30 mg caps)'],
    ['RoboTablets (30 mg tablets)', '(30 mg tablets)'],
  ])('reports units for %s', async (taking, units) => {
    expect((await calcDxm(100, 'kg', taking)).units).toBe(units);
  });

  it('computes plateau ranges for pure DXM in kg', async () => {
    const { data } = await calcDxm(100, 'kg', 'Pure (mg)');
    expect(data.First).toEqual({ min: 150, max: 250 });
    expect(data.Fourth).toEqual({ min: 1500, max: 2000 });
  });

  it('converts pounds to kilograms', async () => {
    const kg = await calcDxm(100, 'kg', 'Pure (mg)');
    const lbs = await calcDxm(100 / 0.453592, 'lbs', 'Pure (mg)');
    expect(lbs.data.First.min).toBeCloseTo(kg.data.First.min, 1);
  });

  it('returns empty units for an unrecognised product', async () => {
    expect((await calcDxm(100, 'kg', 'mystery')).units).toBe('');
  });
});

describe('ketamine dosing', () => {
  it('computes insufflated dosages by weight', async () => {
    expect(await generateInsufflatedDosages(100)).toEqual({
      threshold: '10mg', light: '15mg', common: '30mg', strong: '50mg-75mg', kHole: '100mg',
    });
  });

  it('computes rectal dosages by weight', async () => {
    expect(await generateRectalDosages(100)).toEqual({
      threshold: '30mg', light: '50mg', common: '75mg-200mg', strong: '200mg-250mg', kHole: '300mg-400mg',
    });
  });

  it('formats both routes and converts kg to lbs', async () => {
    const lbs = await calcKetamine(100, 'lbs');
    expect(lbs.insufflated).toContain('**Threshold**: 10mg');
    expect(lbs.rectal).toContain('**KHole**: 300mg-400mg');
    const kg = await calcKetamine(100 / 2.20462, 'kg');
    expect(kg.insufflated).toBe(lbs.insufflated);
  });
});

describe('calcMDMA', () => {
  it('scales dose by body weight in kg', async () => {
    const result = await calcMDMA(100, 'kg');
    expect(result['🌱 First Time']).toBe('80mg (0.8mg/kg)');
    expect(result['⚠️ Max']).toBe('200mg (2.0mg/kg)');
  });

  it('converts from pounds', async () => {
    const result = await calcMDMA(220.462, 'lbs');
    expect(result['🔆 Light']).toBe('120mg (1.2mg/kg)');
  });
});

describe('solvent maths', () => {
  it('calculates solvent volume', async () => {
    expect(await calcSolvent(100, 10, 0.5)).toBe(5);
  });
  it('calculates substance mass', async () => {
    expect(await calcSubstance(5, 10, 0.5)).toBe(100);
  });
});

describe('calcPsychedelics', () => {
  it('never recommends less than the last dose', async () => {
    expect(await calcPsychedelics(100, 1000, null)).toBeGreaterThanOrEqual(100);
  });

  it('estimates a larger dose soon after the last one', async () => {
    const soon = await calcPsychedelics(100, 1, null);
    const later = await calcPsychedelics(100, 14, null);
    expect(soon).toBeGreaterThan(later);
  });

  it('accounts for a desired dose and never goes below it', async () => {
    expect(await calcPsychedelics(100, 1000, 150)).toBeGreaterThanOrEqual(150);
    expect(await calcPsychedelics(100, 1, 150)).toBeGreaterThan(150);
  });
});

describe('calcOpioid', () => {
  it('delegates to the opioid converter', async () => {
    const result = await calcOpioid(10, 'morphine', 'morphine');
    expect(result.ok).toBe(true);
    expect(await calcOpioid(-1, 'morphine', 'morphine')).toMatchObject({ ok: false, reason: 'invalid_dose' });
  });
});
