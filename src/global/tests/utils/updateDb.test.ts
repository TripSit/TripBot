/* eslint-disable sonarjs/no-duplicate-string */
import axios from 'axios';

const mocks = vi.hoisted(() => ({ writeFile: vi.fn(), readFile: vi.fn(), request: vi.fn() }));

vi.mock('fs/promises', () => ({ default: { writeFile: mocks.writeFile, readFile: mocks.readFile } }));
vi.mock('axios');
vi.mock('graphql-request', () => ({
  GraphQLClient: class {
    request = mocks.request;
  },
}));

const e = env as unknown as Record<string, string>;
const originalEnv = e.NODE_ENV;

const range = (min: number, max?: number, units?: string) => ({ min, max, units });

const pwSubstances = [
  {
    url: 'https://psychonautwiki.org/wiki/Foo',
    name: 'Foo',
    summary: 'pw summary',
    commonNames: ['fooey'],
    toxicity: ['tox'],
    addictionPotential: 'low',
    tolerance: { full: '1 week' },
    crossTolerances: ['bar'],
    uncertainInteractions: [{ name: 'Uncertain' }],
    unsafeInteractions: [{ name: 'Unsafe' }],
    dangerousInteractions: [{ name: 'Dangerous' }],
    roa: {
      oral: {
        dose: {
          units: 'mg',
          threshold: 5,
          light: range(10, 20),
          common: range(20, 40),
          strong: range(40, 60),
          heavy: 100,
          junk: null,
        },
        duration: {
          total: range(4, undefined, 'hours'), onset: range(30, 60, 'minutes'), peak: null, comeup: { max: 5, units: 'm' },
        },
        bioavailability: { max: 90 },
      },
      sublingual: { dose: { units: 'mg', common: range(1, 2) }, duration: null },
      buccal: { dose: null, duration: { total: range(1, 2, 'h') } },
      smoked: null,
    },
  },
  {
    url: 'https://psychonautwiki.org/wiki/Bare',
    name: 'Bare',
    summary: '',
    commonNames: null,
    toxicity: null,
    addictionPotential: null,
    tolerance: null,
    crossTolerances: null,
    roa: null,
  },
];

const tsDrugs = {
  foo: {
    name: 'foo',
    aliases: ['fooey', 'extra'],
    links: { experiences: 'https://exp' },
    properties: { summary: 'ts summary', 'test-kits': 'marquis', bioavailability: '50%' },
    categories: ['psychedelic', 'benzodiazepine', 'common'],
    dose_note: 'general note',
    formatted_dose: {
      Oral: {
        Threshold: '10mg', Dangerous: '500mg', Note: 'be careful', Bogus: '5mg', Light: 'none',
      },
      Insufflated: { Common: '20-40mg' },
    },
    formatted_onset: { value: '30', _unit: 'minutes' },
    formatted_duration: { Oral: '4-6', Insufflated: '1', _unit: 'hours' },
    formatted_aftereffects: { Oral: '2', _unit: 'hours' },
    combos: {
      alcohol: { status: 'Dangerous', note: 'never', sources: [{ author: 'a', title: 't', url: 'u' }] },
      lsd: { status: 'Caution' },
    },
  },
  baz: { name: 'Baz', properties: {} },
};

function mockNetwork() {
  vi.mocked(axios.get).mockImplementation(async (url: string) => ({
    data: url.endsWith('combos.json') ? { foo: { bar: { status: 'Low Risk & Synergy' } } } : tsDrugs,
  }));
  mocks.request.mockResolvedValue({ substances: pwSubstances });
}

async function run() {
  vi.resetModules();
  const mod = await import('../../utils/updateDb');
  await mod.default();
}

const written = (name: string) => {
  const call = (mocks.writeFile.mock.calls as string[][]).find(args => args[0].endsWith(`${name}.json`));
  return call ? JSON.parse(call[1]) : undefined;
};

afterEach(() => {
  e.NODE_ENV = originalEnv;
});

describe('updateDrugDb', () => {
  beforeEach(() => {
    e.NODE_ENV = 'test';
    mocks.writeFile.mockResolvedValue(undefined);
    mockNetwork();
  });

  it('saves the raw sources and the combined database', async () => {
    await run();
    ['tripsitCombos', 'psychonautDB', 'tripsitDB', 'combinedDB'].forEach(name => {
      expect(written(name), name).toBeDefined();
    });
  });

  it('merges psychonaut and tripsit data for matching drugs', async () => {
    await run();
    const db = written('combinedDB');
    expect(db.map((d: { name: string }) => d.name)).toEqual(['Foo', 'Bare', 'Baz']);

    const foo = db[0];
    expect(foo.aliases).toEqual(['fooey', 'extra']);
    expect(foo.aliasesStr).toBe('fooey, extra');
    expect(foo.summary).toBe('ts summary');
    expect(foo.reagents).toBe('marquis');
    expect(foo.experiencesUrl).toBe('https://exp');
    expect(foo.classes).toEqual({ psychoactive: ['Psychedelic'], chemical: ['Benzodiazepine', 'Common'] });
    expect(foo.interactions.map((i: { name: string }) => i.name)).toEqual(['alcohol', 'lsd']);
    expect(foo.interactions[0]).toMatchObject({ status: 'Dangerous', note: 'never' });
  });

  it('keeps psychonaut doses and fills gaps from tripsit, in strength order', async () => {
    await run();
    const oral = written('combinedDB')[0].roas.find((r: { name: string }) => r.name === 'Oral');
    const names = oral.dosage.map((d: { name: string }) => d.name);
    expect(names).toEqual(['Threshold', 'Light', 'Common', 'Strong', 'Heavy', 'Dangerous']);
    expect(oral.dosage[0].value).toBe('5 mg');
    expect(oral.dosage[1].value).toBe('10-20 mg');
    expect(oral.dosage.at(-1)).toMatchObject({ value: '500 mg', note: 'be careful' });
    expect(oral.bioavailability).toBe('90%');
  });

  it('formats durations in period order and skips ones without a minimum', async () => {
    await run();
    const oral = written('combinedDB')[0].roas.find((r: { name: string }) => r.name === 'Oral');
    const periods = oral.duration.map((d: { name: string }) => d.name);
    expect(periods).toEqual(expect.arrayContaining(['Onset', 'Total']));
    expect(periods).not.toContain('Comeup');
    expect(periods.indexOf('Onset')).toBeLessThan(periods.indexOf('Total'));
  });

  it('only keeps routes that have both dose and duration from psychonaut', async () => {
    await run();
    const roaNames = written('combinedDB')[0].roas.map((r: { name: string }) => r.name);
    expect(roaNames).toContain('Oral');
    expect(roaNames).toContain('Insufflated');
    expect(roaNames).not.toContain('Sublingual');
    expect(roaNames).not.toContain('Buccal');
  });

  it('adds tripsit-only drugs with a wiki url', async () => {
    await run();
    const baz = written('combinedDB')[2];
    expect(baz).toEqual({ name: 'Baz', url: 'https://wiki.tripsit.me/wiki/Baz' });
  });

  it('records psychonaut interactions with their severity', async () => {
    mocks.request.mockResolvedValueOnce({ substances: [pwSubstances[0]] });
    vi.mocked(axios.get).mockResolvedValue({ data: {} });
    await run();
    const [foo] = written('combinedDB');
    expect(foo.interactions).toEqual([
      { status: 'Caution', name: 'Uncertain' }, { status: 'Unsafe', name: 'Unsafe' },
      { status: 'Dangerous', name: 'Dangerous' },
    ]);
  });

  it('survives upstream failures with an empty database', async () => {
    vi.mocked(axios.get).mockImplementation(async (url: string) => {
      if (url.endsWith('combos.json')) return { data: {} };
      throw new Error('github down');
    });
    mocks.request.mockRejectedValue(new Error('pw down'));
    await run();
    expect(written('combinedDB')).toEqual([]);
    expect(written('tripsitDB')).toBeUndefined();
    expect(written('psychonautDB')).toBeUndefined();
  });
});

describe('updateDrugDb in development (cache)', () => {
  beforeEach(() => {
    e.NODE_ENV = 'development';
    mocks.writeFile.mockResolvedValue(undefined);
    mockNetwork();
  });

  it('reads cached files instead of calling the APIs', async () => {
    const cached: Record<string, unknown> = { 'tripsitDB.json': tsDrugs, 'psychonautDB.json': pwSubstances };
    mocks.readFile.mockImplementation(async (file: string) => {
      const key = Object.keys(cached).find(name => file.endsWith(name));
      return Buffer.from(JSON.stringify(key ? cached[key] : {}));
    });
    await run();
    expect(axios.get).not.toHaveBeenCalled();
    expect(mocks.request).not.toHaveBeenCalled();
    expect(written('combinedDB')).toHaveLength(3);
  });

  it('falls back to the network when a cache file is unreadable', async () => {
    mocks.readFile.mockRejectedValue(new Error('ENOENT'));
    await run();
    expect(axios.get).toHaveBeenCalled();
    expect(mocks.request).toHaveBeenCalled();
    expect(written('combinedDB')).toHaveLength(3);
  });
});
