/* eslint-disable sonarjs/no-duplicate-string */
import {
  convertOpioid, doseUnit, findOpioid, formatDose, formatPotency, isMicrogramScale, opioids, referenceRoute,
  routeIsAssumed, DEFAULT_OPIOID_SUGGESTIONS, MORPHINE_NAME, ROUTE_LABELS, ROUTE_SHORT, PHARMACOLOGY_WARNINGS,
} from '../../utils/opioids';

describe('opioid table integrity', () => {
  it('has unique names, lowercase aliases, and every name resolves', () => {
    const names = opioids.map(o => o.name);
    expect(new Set(names).size).toBe(names.length);
    opioids.forEach(o => {
      expect(findOpioid(o.name)).toBe(o);
      expect(o.aliases.every(a => a === a.toLowerCase())).toBe(true);
    });
  });

  it('has a valid reference route and positive potency ranges for every opioid', () => {
    opioids.forEach(o => {
      expect(referenceRoute(o)).toBeDefined();
      Object.values(o.potency).forEach(range => {
        expect(range[0]).toBeGreaterThan(0);
        expect(range[1]).toBeGreaterThanOrEqual(range[0]);
      });
    });
  });

  it('includes morphine as the 1x reference and every suggestion resolves', () => {
    expect(findOpioid(MORPHINE_NAME)?.potency.oral).toEqual([1, 1]);
    DEFAULT_OPIOID_SUGGESTIONS.forEach(name => expect(findOpioid(name), name).toBeDefined());
  });

  it('labels every route', () => {
    Object.keys(ROUTE_LABELS).forEach(route => expect(ROUTE_SHORT).toHaveProperty(route));
    expect(Object.keys(PHARMACOLOGY_WARNINGS)).toHaveLength(3);
  });
});

describe('findOpioid', () => {
  it('is case- and whitespace-insensitive', () => {
    expect(findOpioid('  MORPHINE ')?.name).toBe('Morphine');
  });
  it('returns undefined for blanks and unknowns', () => {
    expect(findOpioid('')).toBeUndefined();
    expect(findOpioid('   ')).toBeUndefined();
    expect(findOpioid('nonsense')).toBeUndefined();
  });
});

describe('formatting helpers', () => {
  it('detects microgram scale', () => {
    expect(isMicrogramScale([0.1, 0.5])).toBe(true);
    expect(isMicrogramScale([0.5, 2])).toBe(false);
    expect(doseUnit([0.1, 0.5])).toBe('mcg');
    expect(doseUnit([5, 6])).toBe('mg');
  });

  it('formats dose ranges, collapsing equal bounds', () => {
    expect(formatDose([10, 10])).toBe('10mg');
    expect(formatDose([10, 20])).toBe('10 - 20mg');
    expect(formatDose([0.1, 0.25])).toBe('100 - 250mcg');
    expect(formatDose([0.1, 0.25], 'mg')).toBe('0.1 - 0.25mg');
    expect(formatDose([1, 2], 'mcg')).toBe('1000 - 2000mcg');
    expect(formatDose([Number.NaN, 1])).toBe('not calculable');
    expect(formatDose([0, 0])).toBe('0mcg');
  });

  it('formats potency', () => {
    expect(formatPotency([1, 1])).toBe('1x');
    expect(formatPotency([3, 4])).toBe('3 - 4x');
  });
});

describe('route helpers', () => {
  it('reports assumed routes only for oral', () => {
    const assumed = opioids.find(o => o.assumedRoute);
    if (assumed) {
      expect(routeIsAssumed(assumed, 'oral')).toBe(true);
      expect(routeIsAssumed(assumed, 'parenteral')).toBe(false);
    }
    const stated = opioids.find(o => !o.assumedRoute);
    expect(routeIsAssumed(stated!, 'oral')).toBe(false);
  });
});

describe('convertOpioid', () => {
  it.each([[0], [-1], [Number.NaN], [Infinity]])('rejects dose %s', dose => {
    expect(convertOpioid(dose, 'morphine', 'oxycodone')).toMatchObject({ ok: false, reason: 'invalid_dose' });
  });

  it('rejects absurdly large doses', () => {
    expect(convertOpioid(100001, 'morphine', 'oxycodone')).toMatchObject({ ok: false, reason: 'invalid_dose' });
  });

  it('rejects unknown drugs on either side', () => {
    expect(convertOpioid(10, 'zzz', 'morphine')).toMatchObject({ ok: false, reason: 'unknown_from' });
    expect(convertOpioid(10, 'morphine', 'zzz')).toMatchObject({ ok: false, reason: 'unknown_to' });
  });

  it('returns the input unchanged when converting a drug to itself', () => {
    const result = convertOpioid(30, 'morphine', 'morphine');
    expect(result).toMatchObject({
      ok: true, sameDrug: true, equianalgesic: [30, 30], cautiousStart: null,
    });
  });

  it('pivots through oral morphine and applies the cautious reduction', () => {
    const result = convertOpioid(30, 'morphine', 'oxycodone');
    if (!result.ok) throw new Error('expected success');
    const oxy = findOpioid('oxycodone')!;
    const [pLow, pHigh] = oxy.potency.oral!;
    expect(result.morphineEquivalent).toEqual([30, 30]);
    expect(result.equianalgesic[0]).toBeCloseTo(30 / pHigh);
    expect(result.equianalgesic[1]).toBeCloseTo(30 / pLow);
    expect(result.cautiousStart![0]).toBeCloseTo(result.equianalgesic[0] * 0.5);
    expect(result.cautiousStart![1]).toBeCloseTo(result.equianalgesic[1] * 0.75);
    expect(result.cautiousStart![1]).toBeLessThan(result.equianalgesic[1]);
  });

  it('produces route breakdowns for drugs with multiple routes', () => {
    const withRoutes = opioids.find(o => Object.keys(o.potency).length > 1 && o.name !== MORPHINE_NAME)!;
    const result = convertOpioid(10, 'morphine', withRoutes.name);
    if (!result.ok) throw new Error('expected success');
    expect(result.otherRoutes.length).toBeGreaterThan(0);
  });

  it('estimates routes from bioavailability when no potency is listed', () => {
    const bioOnly = opioids.find(o => {
      const ref = referenceRoute(o)!;
      return o.bioavailability?.[ref]
        && Object.keys(o.bioavailability).some(r => r !== ref && !o.potency[r as keyof typeof o.potency]);
    });
    if (!bioOnly) return;
    const result = convertOpioid(10, 'morphine', bioOnly.name);
    if (!result.ok) throw new Error('expected success');
    expect(result.otherRoutes.some(r => r.estimated)).toBe(true);
  });

  it('converts every opioid in both directions without NaN', () => {
    opioids.forEach(o => {
      const result = convertOpioid(10, MORPHINE_NAME, o.name);
      if (!result.ok) throw new Error(`${o.name}: ${result.message}`);
      expect(result.equianalgesic.every(Number.isFinite)).toBe(true);
      expect(convertOpioid(10, o.name, MORPHINE_NAME).ok).toBe(true);
    });
  });
});
