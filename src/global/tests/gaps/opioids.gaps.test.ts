import { convertOpioid, opioids, type Opioid } from '../../utils/opioids';

describe('convertOpioid with incomplete table data', () => {
  it('reports a missing potency figure instead of converting', () => {
    const broken = {
      name: 'Brokenine', aliases: ['brokenine'], potency: {}, bioavailability: {},
    } as unknown as Opioid;
    opioids.push(broken);
    try {
      const forward = convertOpioid(10, 'brokenine', 'morphine');
      expect(forward).toMatchObject({ ok: false, reason: 'no_potency_data' });
      const backward = convertOpioid(10, 'morphine', 'brokenine');
      expect(backward).toMatchObject({ ok: false, reason: 'no_potency_data' });
    } finally {
      opioids.pop();
    }
  });
});
