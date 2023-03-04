import { dReagents } from '../../src/discord/commands/global/d.reagents';
import { executeCommandAndSpyEditReply, getParsedCommand } from '../utils/testutils';

const F = f(__filename); // eslint-disable-line

const slashCommand = dReagents;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({
      content: 'https://i.imgur.com/wETJsZr.png',
    });
  });
});
