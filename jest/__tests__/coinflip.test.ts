import { dCoinflip } from '../../src/discord/commands/global/d.coinflip';
import { executeCommandAndSpyReply, getParsedCommand } from '../utils/testutils';

const slashCommand = dCoinflip;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith(expect.any(String));
  });
});
