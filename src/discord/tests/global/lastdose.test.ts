import { dLastdose } from '../../commands/global/d.lastdose';
import lastDose, { LastDose } from '../../../global/commands/g.lastdose';
import { lastReply, slashStub } from '../../../vitest/utils/commandStubs';

vi.mock('../../../global/commands/g.lastdose', () => ({ default: vi.fn() }));

const saved: LastDose = {
  amount: 0.5,
  units: 'MG',
  route: 'ORAL',
  takenAt: new Date('2024-01-01T00:00:00Z'),
  substance: 'Example substance',
};

beforeEach(() => {
  vi.mocked(lastDose).mockResolvedValue(saved);
});

it('registers a self-only command with the standard privacy option', () => {
  const data = dLastdose.data.toJSON();
  expect(data.name).toBe('lastdose');
  expect(data.contexts).toEqual([0, 1, 2]);
  expect(data.integration_types).toEqual([0, 1]);
  expect(data.options).toEqual([expect.objectContaining({
    name: 'ephemeral', type: 5, description: 'Set to False to show the response to everyone',
  })]);
});

it.each([
  [undefined, 64],
  [true, 64],
  [false, undefined],
])('uses the requested privacy setting %s', async (ephemeral, flags) => {
  const stub = slashStub({ options: { ephemeral } });
  vi.mocked(lastDose).mockImplementation(async caller => {
    expect(stub.deferReply).toHaveBeenCalledWith({ flags });
    expect(caller).toBe(stub.user.id);
    return saved;
  });
  expect(await dLastdose.execute(stub as never)).toBe(true);
  expect(stub.deferReply).toHaveBeenCalledTimes(1);
  expect(stub.editReply).toHaveBeenCalledTimes(1);
  expect(stub.user.send).not.toHaveBeenCalled();
});

it.each([
  ['MG', 'mg'], ['ML', 'mL'], ['MICRO_G', 'µg'], ['G', 'g'], ['OZ', 'oz'], ['FLOZ', 'fl oz'],
] as const)('shows the saved %s unit, amount, route and both timestamps', async (unit, label) => {
  vi.mocked(lastDose).mockResolvedValue({ ...saved, units: unit, route: 'SUBLINGUAL' });
  const stub = slashStub();
  await dLastdose.execute(stub as never);
  const reply = lastReply(stub);
  const embed = (reply.embeds as Array<{ data: { title: string; fields: Array<{ name: string; value: string }> } }>)[0];
  expect(embed.data.title).toBe('Your last saved dose');
  expect(embed.data.fields).toEqual([
    { name: 'Recorded dose', value: `0.5 ${label} of Example substance (Sublingual)` },
    { name: 'Taken', value: '<t:1704067200:F> (<t:1704067200:R>)' },
  ]);
  expect(reply.allowedMentions).toEqual({ parse: [] });
});

it('helps callers with no saved records without showing an empty embed', async () => {
  vi.mocked(lastDose).mockResolvedValue(null);
  const stub = slashStub();
  expect(await dLastdose.execute(stub as never)).toBe(false);
  expect(lastReply(stub)).toEqual({ content: 'You have no saved dose records. Use /idose set to add one.' });
});

it('handles storage failures without exposing the underlying error or dose data', async () => {
  const error = vi.spyOn(log, 'error');
  try {
    vi.mocked(lastDose).mockRejectedValue(new Error('private-dose-record-canary'));
    const stub = slashStub();
    expect(await dLastdose.execute(stub as never)).toBe(false);
    expect(lastReply(stub)).toEqual({ content: 'I could not retrieve your last dose. Please try again later.' });
    expect(error).toHaveBeenCalledWith(expect.any(String), 'Could not retrieve the latest saved dose');
    expect(JSON.stringify(error.mock.calls)).not.toContain('private-dose-record-canary');
  } finally {
    error.mockRestore();
  }
});
