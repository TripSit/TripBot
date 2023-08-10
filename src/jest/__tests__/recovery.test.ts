import { dRecovery } from '../../discord/commands/global/d.recovery';
import { executeCommandAndSpyEditReply, getParsedCommand } from '../utils/testutils';

const slashCommand = dRecovery;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      content: 'https://i.imgur.com/nTEm0QE.png',
    });
  });
});
