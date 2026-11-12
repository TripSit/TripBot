/* eslint-disable sonarjs/no-duplicate-string */
import { autocomplete } from '../../events/autocomplete';
import units from '../../../../assets/data/units_of_measurement.json';
import { dbMock } from '../../../vitest/utils/mockDb';

type Choice = { name: string; value: string };

function interaction(over: {
  commandName: string; focused?: string; focusedName?: string; subcommand?: string; data?: unknown[]; user?: string | null;
  respond?: ReturnType<typeof vi.fn>;
}) {
  const respond = over.respond ?? vi.fn();
  return {
    raw: {
      commandName: over.commandName,
      respond,
      options: {
        getFocused: (full?: boolean) => (full ? { name: over.focusedName, value: over.focused ?? '' } : (over.focused ?? '')),
        getSubcommand: () => over.subcommand,
        get: (name: string) => (name === 'user' && over.user ? { value: over.user } : null),
        data: over.data ?? [],
      },
    } as never,
    respond,
  };
}

const lastChoices = (respond: ReturnType<typeof vi.fn>) => respond.mock.calls.at(-1)?.[0] as Choice[];

describe('autocomplete: pills', () => {
  it.each(['color', 'shape'])('suggests %s matches and defaults when nothing matches', async name => {
    const none = interaction({ commandName: 'pill-id', focusedName: name, focused: 'zzzzzzzzqqq' });
    await autocomplete(none.raw);
    expect(lastChoices(none.respond).length).toBeGreaterThan(10);
    expect(lastChoices(none.respond).length).toBeLessThanOrEqual(25);
    const some = interaction({ commandName: 'pill-id', focusedName: name, focused: lastChoices(none.respond)[0].name.slice(0, 3) });
    await autocomplete(some.raw);
    expect(lastChoices(some.respond).length).toBeGreaterThan(0);
    expect(lastChoices(some.respond).length).toBeLessThanOrEqual(25);
  });

  it('does nothing for other focused options', async () => {
    const i = interaction({ commandName: 'pill-id', focusedName: 'other' });
    await autocomplete(i.raw);
    expect(i.respond).not.toHaveBeenCalled();
  });
});

describe('autocomplete: calc benzo', () => {
  it('only offers benzodiazepines, with a default list when nothing matches', async () => {
    const fallback = interaction({ commandName: 'calc', subcommand: 'benzo', focused: 'qqqqqqqqzz' });
    await autocomplete(fallback.raw);
    expect(lastChoices(fallback.respond).length).toBeGreaterThan(0);
    const match = interaction({ commandName: 'calc', subcommand: 'benzo', focused: 'alprazolam' });
    await autocomplete(match.raw);
    expect(lastChoices(match.respond)[0].name).toBe('alprazolam');
  });
});

describe('autocomplete: timezone', () => {
  it('matches labels and falls back to the first 25 zones', async () => {
    const match = interaction({ commandName: 'timezone', focused: 'Pacific' });
    await autocomplete(match.raw);
    expect(lastChoices(match.respond).some(c => c.name.includes('Pacific'))).toBe(true);
    const none = interaction({ commandName: 'timezone', focused: 'qqqqzzzzxxxx' });
    await autocomplete(none.raw);
    expect(lastChoices(none.respond)).toHaveLength(25);
  });
});

describe('autocomplete: convert', () => {
  const flush = () => new Promise<void>(resolve => { setImmediate(resolve); });
  const first = units[0];

  it('offers every unit when no first unit is chosen', async () => {
    const i = interaction({ commandName: 'convert', focused: '', data: [] });
    await autocomplete(i.raw);
    await flush();
    expect(lastChoices(i.respond)).toHaveLength(25);
  });

  it('restricts to the same measure once the first unit is chosen', async () => {
    const sameMeasure = units.filter(u => u.measure === first.measure);
    const i = interaction({ commandName: 'convert', focused: '', data: [{}, { value: first.abbr.toUpperCase(), focused: false }] });
    await autocomplete(i.raw);
    await flush();
    const names = lastChoices(i.respond).map(c => c.name);
    expect(names.length).toBe(Math.min(25, sameMeasure.length));
    expect(names.every(n => sameMeasure.some(u => u.abbr === n))).toBe(true);
  });

  it('matches typed text, or lists all while the second option is focused', async () => {
    const typed = interaction({ commandName: 'convert', focused: first.plural, data: [{}, { value: first.abbr, focused: false }] });
    await autocomplete(typed.raw);
    await flush();
    expect(lastChoices(typed.respond).length).toBeGreaterThan(0);
    const focused = interaction({ commandName: 'convert', focused: '', data: [{}, { value: first.abbr, focused: true }] });
    await autocomplete(focused.raw);
    await flush();
    expect(lastChoices(focused.respond)).toHaveLength(25);
  });

  it('falls back sensibly when nothing matches', async () => {
    const withMeasure = interaction({ commandName: 'convert', focused: 'qqqqzzzzxxxx', data: [{}, { value: first.abbr, focused: false }] });
    await autocomplete(withMeasure.raw);
    await flush();
    expect(lastChoices(withMeasure.respond).length).toBeGreaterThan(0);
    const unknownUnit = interaction({ commandName: 'convert', focused: 'qqqqzzzzxxxx', data: [{}, { value: 'nonsense-unit', focused: false }] });
    await autocomplete(unknownUnit.raw);
    await flush();
    expect(lastChoices(unknownUnit.respond)).toHaveLength(25);
  });
});

describe('autocomplete: calc opioid', () => {
  it('matches opioid names and aliases', async () => {
    const i = interaction({ commandName: 'calc', subcommand: 'opioid', focused: 'oxyc' });
    await autocomplete(i.raw);
    expect(lastChoices(i.respond).map(c => c.name)).toContain('Oxycodone');
  });

  it('suggests the defaults when nothing matches', async () => {
    const i = interaction({ commandName: 'calc', subcommand: 'opioid', focused: 'qqqqzzzzxxxx' });
    await autocomplete(i.raw);
    expect(lastChoices(i.respond).map(c => c.name)).toContain('Morphine');
  });

  it('never rejects when Discord refuses the response', async () => {
    const i = interaction({
      commandName: 'calc', subcommand: 'opioid', focused: 'oxy', respond: vi.fn().mockRejectedValue(new Error('Unknown interaction')),
    });
    await expect(autocomplete(i.raw)).resolves.toBeUndefined();
  });
});

describe('autocomplete: quote', () => {
  const quotes = [{
    quote: 'Be excellent to each other', user_id: 'u', url: '', date: new Date(),
  }, {
    quote: 'x'.repeat(150), user_id: 'u', url: '', date: new Date(),
  }];

  beforeEach(() => { dbMock.quotes.findMany.mockResolvedValue(quotes as never); });

  it('searches quotes, truncating long ones', async () => {
    const i = interaction({ commandName: 'quote', focused: 'excellent' });
    await autocomplete(i.raw);
    expect(lastChoices(i.respond)).toEqual([{ name: 'Be excellent to each other', value: 'Be excellent to each other' }]);
  });

  it('filters by user when provided', async () => {
    dbMock.users.upsert.mockResolvedValue({ id: 'uid' } as never);
    const i = interaction({ commandName: 'quote', focused: '', user: 'discord-id' });
    await autocomplete(i.raw);
    expect(dbMock.quotes.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { user_id: 'uid' } }));
    expect(lastChoices(i.respond)[1].name).toHaveLength(99);
  });

  it('reports no results for unmatched searches', async () => {
    const i = interaction({ commandName: 'quote', focused: 'qqqqzzzzxxxx' });
    await autocomplete(i.raw);
    expect(lastChoices(i.respond)).toEqual([{ name: 'No results found', value: 'No results found' }]);
  });
});

describe('autocomplete: drug names (default)', () => {
  it('fuzzy matches names and aliases', async () => {
    const i = interaction({ commandName: 'drug', focused: 'lsd' });
    await autocomplete(i.raw);
    expect(lastChoices(i.respond).map(c => c.name)).toContain('LSD');
  });

  it('suggests popular drugs when nothing matches', async () => {
    const i = interaction({ commandName: 'drug', focused: 'qqqqzzzzxxxx' });
    await autocomplete(i.raw);
    const names = lastChoices(i.respond).map(c => c.name);
    expect(names).toHaveLength(25);
    expect(names).toContain('MDMA');
  });

  it('is also used for calc subcommands without their own autocomplete', async () => {
    const i = interaction({ commandName: 'calc', subcommand: 'dxm', focused: 'dxm' });
    await autocomplete(i.raw);
    expect(i.respond).toHaveBeenCalled();
  });
});
