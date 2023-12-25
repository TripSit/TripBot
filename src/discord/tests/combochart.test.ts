import { dCombochart } from '../commands/global/d.combochart';
import { executeCommandAndSpyEditReply, getParsedCommand } from '../../jest/utils/testutils';

const slashCommand = dCombochart;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'https://i.imgur.com/juzYjDl.png' });
  });
});
