import { dTopic } from '../commands/global/d.topic';
import { executeCommandAndSpyEditReply, getParsedCommand } from '../../jest/utils/testutils';

const F = f(__filename); // eslint-disable-line

const slashCommand = dTopic;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith(
      expect.any(String),
    );
  });
});
