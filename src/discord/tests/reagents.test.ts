import { dReagents } from '../commands/global/d.reagents';
import { executeCommandAndSpyEditReply, getParsedCommand } from '../../jest/utils/testutils';

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
      content: 'https://user-images.githubusercontent.com/1836049/222908130-df3a881b-3ced-462f-a0db-6c2a34cd62ec.png',
    });
  });
});
