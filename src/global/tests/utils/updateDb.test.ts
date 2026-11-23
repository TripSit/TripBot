/* eslint-disable sonarjs/no-duplicate-string */
import axios from 'axios';

const mocks = vi.hoisted(() => ({
  writeFile: vi.fn(), readFile: vi.fn(), request: vi.fn(), graphqlSignal: undefined as AbortSignal | undefined,
}));

vi.mock('fs/promises', () => ({ default: { writeFile: mocks.writeFile, readFile: mocks.readFile } }));
vi.mock('axios');
vi.mock('graphql-request', () => ({
  GraphQLClient: class {
    constructor(_url: string, options: { signal: AbortSignal }) {
      mocks.graphqlSignal = options.signal;
    }

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

describe('updateDrugDb refreshes the data the bot serves', () => {
  beforeEach(() => {
    e.NODE_ENV = 'test';
    mocks.writeFile.mockResolvedValue(undefined);
    mockNetwork();
  });

  it('makes a refreshed database visible to drug() without a restart', async () => {
    vi.resetModules();
    const updateDb = (await import('../../utils/updateDb')).default;
    const { drug } = await import('../../commands/g.drug');
    expect(await drug('Bare')).toBeUndefined();

    await updateDb();
    expect((await drug('Bare'))?.name).toBe('Bare');

    // A second run with different upstream data replaces what the first one loaded
    vi.mocked(axios.get).mockImplementation(async (url: string) => ({
      data: url.endsWith('combos.json') ? {} : { Quux: { name: 'quux', pretty_name: 'Quux', properties: {} } },
    }));
    mocks.request.mockResolvedValue({ substances: [] });
    await updateDb();
    expect(await drug('Bare')).toBeUndefined();
    expect((await drug('Quux'))?.name).toBe('quux');
  });
});

describe('updateDrugDb refreshes fallback combination data', () => {
  beforeEach(() => {
    e.NODE_ENV = 'test';
    mocks.writeFile.mockResolvedValue(undefined);
    mockNetwork();
  });

  it('publishes changed and removed combinations to the already-loaded command', async () => {
    vi.resetModules();
    const updateDb = (await import('../../utils/updateDb')).default;
    const { combo } = await import('../../commands/g.combo');
    const first = 'refreshcanaryalpha';
    const second = 'refreshcanarybravo';
    let snapshot: Record<string, unknown> = {
      [first]: { [second]: { status: 'Low Risk & Synergy', note: 'first-source-note' } },
      [second]: {},
    };
    vi.mocked(axios.get).mockImplementation(async (url: string) => ({
      data: url.endsWith('combos.json') ? snapshot : tsDrugs,
    }));
    expect(await combo(first, second)).toMatchObject({ err: true });

    await updateDb();
    expect(await combo(first, second)).toMatchObject({ result: 'Low Risk & Synergy', note: 'first-source-note' });

    snapshot = {
      [first]: { [second]: { status: 'Dangerous', note: 'updated-source-note' } },
      [second]: {},
    };
    await updateDb();
    expect(await combo(first, second)).toMatchObject({ result: 'Dangerous', note: 'updated-source-note' });

    snapshot = {};
    await updateDb();
    expect(await combo(first, second)).toMatchObject({ err: true });
  });
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
    vi.mocked(axios.get).mockImplementation(async () => ({ data: { baz: tsDrugs.baz } }));
    await run();
    const [foo] = written('combinedDB');
    expect(foo.interactions).toEqual([
      { status: 'Caution', name: 'Uncertain' }, { status: 'Unsafe', name: 'Unsafe' },
      { status: 'Dangerous', name: 'Dangerous' },
    ]);
  });

  it('copes with tripsit-only drugs that have unusual shapes', async () => {
    Object.assign(tsDrugs, {
      qux: {
        name: 'Qux',
        aliases: ['quxy', 'quxie'],
        properties: {},
        categories: [
          'barbiturate', 'benzodiazepine', 'common', 'deliriant', 'depressant', 'dissociative', 'empathogen', 'habit-forming', 'inactive',
          'nootropic', 'opioid', 'psychedelic', 'research-chemical', 'ssri', 'stimulant', 'supplement', 'tentative',
        ],
        formatted_dose: { Oral: { Common: '5mg' } },
        formatted_onset: { value: '5', _unit: 'minutes' },
      },
      fooAgain: { name: 'foo', properties: {}, formatted_duration: { Oral: '4-6', _unit: 'hours' } },
    });
    try {
      await run();
      const db = written('combinedDB');
      const qux = db.find((d: { name: string }) => d.name === 'Qux');
      expect(qux.aliases).toEqual(['quxy', 'quxie']);
      expect(qux.aliasesStr).toBe('quxy, quxie');
      expect(qux.roas).toHaveLength(1);
    } finally {
      delete (tsDrugs as Record<string, unknown>).qux;
      delete (tsDrugs as Record<string, unknown>).fooAgain;
    }
  });

  it('handles sparse psychonaut routes and tripsit durations for routes that were never added', async () => {
    const sparse = {
      url: 'https://psychonautwiki.org/wiki/Sparse',
      name: 'Sparse',
      summary: 's',
      commonNames: null,
      toxicity: null,
      addictionPotential: null,
      tolerance: null,
      crossTolerances: null,
      uncertainInteractions: [{ name: 'Only uncertain' }],
      roa: {
        oral: { dose: { units: 'mg', light: 5 }, duration: { total: range(1, undefined, 'h') }, bioavailability: {} },
        rectal: { dose: { units: 'mg', light: 6 }, duration: { total: range(2, undefined, 'h') } },
      },
    };
    Object.assign(tsDrugs, {
      sparse: {
        name: 'Sparse',
        properties: {},
        formatted_dose: { Oral: { Common: '5' } },
        formatted_onset: { value: '5', _unit: 'minutes' },
        formatted_duration: { Intravenous: '1', _unit: 'hours' },
      },
      noroute: {
        name: 'NoRoute', properties: {}, formatted_onset: { value: '5', _unit: 'minutes' }, formatted_duration: { Oral: '1', _unit: 'hours' },
      },
    });
    try {
      mocks.request.mockResolvedValueOnce({ substances: [sparse] });
      await run();
      const db = written('combinedDB');
      const found = db.find((d: { name: string }) => d.name === 'Sparse');
      expect(found.interactions).toEqual([{ status: 'Caution', name: 'Only uncertain' }]);
      expect(found.roas.find((r: { name: string }) => r.name === 'Oral').bioavailability).toBe('%');
      expect(found.roas.map((r: { name: string }) => r.name)).toEqual(expect.arrayContaining(['Oral', 'Rectal']));
    } finally {
      delete (tsDrugs as Record<string, unknown>).sparse;
      delete (tsDrugs as Record<string, unknown>).noroute;
    }
  });

  it('starts with its bundled cache when upstream services are unavailable', async () => {
    vi.resetModules();
    const updateDb = (await import('../../utils/updateDb')).default;
    const combined = (await import('../../../../assets/data/combinedDB.json')).default;
    const tripsit = (await import('../../../../assets/data/tripsitDB.json')).default;
    const before = JSON.stringify([combined, tripsit]);
    expect(combined.length).toBeGreaterThan(0);
    vi.mocked(axios.get).mockRejectedValue(new Error('upstream unavailable'));
    mocks.request.mockRejectedValue(new Error('upstream unavailable'));
    await expect(updateDb()).resolves.toBeUndefined();
    expect(JSON.stringify([combined, tripsit])).toBe(before);
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });
});

describe('updateDrugDb keeps the last usable snapshot', () => {
  beforeEach(() => {
    e.NODE_ENV = 'test';
    mocks.writeFile.mockResolvedValue(undefined);
    mockNetwork();
  });

  afterEach(() => vi.restoreAllMocks());

  it.each(['TripSit', 'Psychonaut', 'combinations'] as const)('keeps all caches intact after a failed %s download, then recovers', async source => {
    vi.resetModules();
    const updateDb = (await import('../../utils/updateDb')).default;
    const combined = (await import('../../../../assets/data/combinedDB.json')).default;
    const tripsit = (await import('../../../../assets/data/tripsitDB.json')).default;
    const combos = (await import('../../../../assets/data/tripsitCombos.json')).default;
    const snapshot = () => JSON.stringify([combined, tripsit, combos]);
    await updateDb();
    const before = snapshot();
    mocks.writeFile.mockClear();
    const warning = vi.spyOn(log, 'warn');
    if (source === 'Psychonaut') {
      mocks.request.mockRejectedValue(new Error('upstream unavailable'));
    } else {
      vi.mocked(axios.get).mockImplementation(async (url: string) => {
        if (url.endsWith(source === 'TripSit' ? 'drugs.json' : 'combos.json')) {
          throw new Error('upstream unavailable');
        }
        return { data: { foo: { bar: { status: 'Low Risk & Synergy' } } } };
      });
    }

    await expect(updateDb()).resolves.toBeUndefined();
    expect(snapshot()).toBe(before);
    expect(mocks.writeFile).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalled();

    mockNetwork();
    mocks.request.mockResolvedValue({
      substances: pwSubstances.map(entry => ({ ...entry, summary: 'recovered-source-text' })),
    });
    await updateDb();
    expect(written('combinedDB')).toBeDefined();
    expect(snapshot()).not.toBe(before);
  });

  it.each(['TripSit', 'both'] as const)('rejects empty %s primary data without overwriting caches', async source => {
    vi.resetModules();
    const updateDb = (await import('../../utils/updateDb')).default;
    await updateDb();
    mocks.writeFile.mockClear();
    vi.mocked(axios.get).mockResolvedValue({ data: {} });
    if (source === 'both') mocks.request.mockResolvedValue({ substances: [] });
    await expect(updateDb()).resolves.toBeUndefined();
    expect(mocks.writeFile).not.toHaveBeenCalled();
  });

  it.each(['TripSit', 'Psychonaut', 'combinations'] as const)('aborts a stalled %s download and preserves the cache', async source => {
    vi.resetModules();
    const updateDb = (await import('../../utils/updateDb')).default;
    await updateDb();
    mocks.writeFile.mockClear();
    vi.useFakeTimers();
    const timeout = vi.spyOn(AbortSignal, 'timeout').mockImplementation(delay => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(new Error('download timed out')), delay);
      return controller.signal;
    });
    let stalledSignal: AbortSignal | undefined;
    const stall = (signal: AbortSignal) => new Promise<never>((_resolve, reject) => {
      stalledSignal = signal;
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    });
    try {
      if (source === 'Psychonaut') {
        mocks.request.mockImplementation(() => stall(mocks.graphqlSignal as AbortSignal));
      } else {
        vi.mocked(axios.get).mockImplementation(async (url, options) => {
          if (url.endsWith(source === 'TripSit' ? 'drugs.json' : 'combos.json')) {
            expect(options?.timeout).toBe(15_000);
            return stall(options?.signal as AbortSignal);
          }
          return { data: { foo: {} } };
        });
      }
      const refresh = updateDb();
      await vi.advanceTimersByTimeAsync(15_000);
      await expect(refresh).resolves.toBeUndefined();
      expect(timeout).toHaveBeenCalledWith(15_000);
      expect(stalledSignal?.aborted).toBe(true);
      expect(mocks.writeFile).not.toHaveBeenCalled();
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it.each(['combined', 'TripSit'] as const)('does not mask a failure when the %s cache is empty', async missing => {
    vi.resetModules();
    const updateDb = (await import('../../utils/updateDb')).default;
    const combined = (await import('../../../../assets/data/combinedDB.json')).default;
    const tripsit = (await import('../../../../assets/data/tripsitDB.json')).default;
    const originalCombined = combined.slice();
    const originalTripsit = { ...tripsit };
    try {
      if (missing === 'combined') combined.splice(0, combined.length);
      else Object.keys(tripsit).forEach(key => { Reflect.deleteProperty(tripsit, key); });
      vi.mocked(axios.get).mockRejectedValue(new Error('upstream unavailable'));
      await expect(updateDb()).rejects.toThrow('upstream unavailable');
      expect(mocks.writeFile).not.toHaveBeenCalled();
    } finally {
      combined.splice(0, combined.length, ...originalCombined);
      Object.assign(tripsit, originalTripsit);
    }
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

  it('repairs only the unreadable raw cache after a complete refresh', async () => {
    mocks.readFile.mockImplementation(async (file: string) => {
      if (file.endsWith('tripsitDB.json')) throw new Error('ENOENT');
      return Buffer.from(JSON.stringify(file.endsWith('psychonautDB.json') ? pwSubstances : {}));
    });
    await run();
    expect(written('tripsitDB')).toBeDefined();
    expect(written('combinedDB')).toHaveLength(3);
    expect(written('tripsitCombos')).toBeUndefined();
    expect(written('psychonautDB')).toBeUndefined();
  });

  it('falls back to the network when a cache file is unreadable', async () => {
    mocks.readFile.mockRejectedValue(new Error('ENOENT'));
    await run();
    expect(axios.get).toHaveBeenCalled();
    expect(mocks.request).toHaveBeenCalled();
    expect(written('combinedDB')).toHaveLength(3);
  });
});
