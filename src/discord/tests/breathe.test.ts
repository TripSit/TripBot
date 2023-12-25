import { dBreathe } from '../commands/global/d.breathe';
import { executeCommandAndSpyEditReply, getParsedCommand } from '../../jest/utils/testutils';

const slashCommand = dBreathe;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'https://tenor.com/view/breathing-gif-15523921' });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} exercise:1`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({ content: 'https://tenor.com/view/breathing-gif-15523921' });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} exercise:2`,
        slashCommand.data,
        'guild',
      ),
    )).toHaveBeenCalledWith({ content: 'https://i.imgur.com/XbH6gP4.gif' });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} exercise:3`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'https://i.imgur.com/g57i96f.gif' });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} exercise:4`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'https://i.imgur.com/MkUcTPl.gif' });
  });
});
