import { dBreathe } from '../../src/discord/commands/global/d.breathe';
import { executeCommandAndSpyEditReply, getParsedCommand } from '../utils/testutils';

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
    )).toHaveBeenCalledWith({ content: 'https://i.imgur.com/n5jBp45.gif' });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} exercise:1`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'https://i.imgur.com/n5jBp45.gif' });

    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} exercise:2`,
        slashCommand.data,
        'dm',
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
