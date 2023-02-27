import { dBreathe } from '../../src/discord/commands/global/d.breathe';
import { executeCommandAndSpyReply, getParsedCommand } from '../utils/testutils';

const slashCommand = dBreathe;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'https://i.imgur.com/n5jBp45.gif', ephemeral: false });

    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} exercise:1`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'https://i.imgur.com/n5jBp45.gif', ephemeral: false });

    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} exercise:2`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'https://i.imgur.com/XbH6gP4.gif', ephemeral: false });

    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} exercise:3`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'https://i.imgur.com/g57i96f.gif', ephemeral: false });

    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name} exercise:4`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'https://i.imgur.com/MkUcTPl.gif', ephemeral: false });
  });
});
