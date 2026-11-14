import { ApplicationCommandOptionType } from 'discord.js';
import type { CommandInteractionOption } from 'discord.js';
import { statParameters } from '../../utils/commandStats';

const opt = (o: object) => o as CommandInteractionOption;

describe('statParameters', () => {
  it('keeps values only for booleans and allow-listed options', () => {
    expect(statParameters([
      opt({ name: 'substance', type: ApplicationCommandOptionType.String, value: 'lsd' }),
      opt({ name: 'ephemeral', type: ApplicationCommandOptionType.Boolean, value: false }),
      opt({ name: 'user', type: ApplicationCommandOptionType.User, value: '1234567890' }),
      opt({ name: 'reason', type: ApplicationCommandOptionType.String, value: 'something personal' }),
    ])).toEqual([
      { name: 'substance', value: 'lsd' },
      { name: 'ephemeral', value: 'false' },
      { name: 'user', value: '' },
      { name: 'reason', value: '' },
    ]);
  });

  it('flattens subcommands and groups, and caps long values', () => {
    const result = statParameters([
      opt({
        name: 'group',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [opt({
          name: 'sub',
          type: ApplicationCommandOptionType.Subcommand,
          options: [opt({ name: 'section', type: ApplicationCommandOptionType.String, value: 'x'.repeat(300) })],
        })],
      }),
      opt({ name: 'empty', type: ApplicationCommandOptionType.Subcommand }),
    ]);
    expect(result).toEqual([{ name: 'section', value: 'x'.repeat(100) }]);
  });

  it('records an allow-listed option with no value as empty', () => {
    expect(statParameters([opt({ name: 'substance', type: ApplicationCommandOptionType.String })]))
      .toEqual([{ name: 'substance', value: '' }]);
  });
});
