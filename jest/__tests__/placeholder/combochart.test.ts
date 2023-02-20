import { dCombochart } from '../../src/discord/commands/global/d.combochart';
import { executeCommandAndSpyReply, getParsedCommand } from '../utils/testutils';

const slashCommand = dCombochart;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith('https://i.imgur.com/juzYjDl.png');
  });
});
