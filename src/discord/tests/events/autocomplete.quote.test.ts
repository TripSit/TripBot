import { autocomplete } from '../../events/autocomplete';
import { dbMock } from '../../../vitest/utils/mockDb';

// With Fuse returning nothing for an empty search the handler falls back to the first stored quotes
vi.mock('fuse.js', () => ({
  default: class {
    search() { return []; }
  },
}));

describe('quote autocomplete without search results', () => {
  it('offers the first quotes when nothing has been typed', async () => {
    dbMock.quotes.findMany.mockResolvedValue([
      { quote: 'first quote' }, { quote: 'x'.repeat(150) },
    ] as never);
    const respond = vi.fn();
    const raw = {
      commandName: 'quote',
      options: {
        getFocused: (full?: boolean) => (full ? { name: 'quote', value: '' } : ''), getSubcommand: () => 'get', get: () => null, data: [],
      },
      respond,
      isAutocomplete: () => true,
    };
    await autocomplete(raw as never);
    const choices = respond.mock.calls[0][0] as Array<{ name: string }>;
    expect(choices.map(c => c.name)).toEqual(['first quote', 'x'.repeat(99)]);
  });
});
