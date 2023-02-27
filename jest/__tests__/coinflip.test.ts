/* eslint-disable max-len */
import { dCoinflip } from '../../src/discord/commands/global/d.coinflip';
import { executeCommandAndSpyReply, getParsedCommand } from '../utils/testutils';

const slashCommand = dCoinflip;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0.00);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'The coin slipped into subspace and disappeared?!', ephemeral: false });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.01);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'The coin landed on its side?!', ephemeral: false });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.02);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'The coin rolled off the table?!', ephemeral: false });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.03);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: expect.any(String), ephemeral: false });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.04);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'The coin kept spinning in the air?!', ephemeral: false });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.96);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'Some kid came and took your coin!', ephemeral: false });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.97);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: expect.any(String), ephemeral: false });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.98);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'You refuse to observe the coin so it is both heads and tails!', ephemeral: false });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.99);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: expect.any(String), ephemeral: false });

    jest.spyOn(global.Math, 'random').mockReturnValue(1);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'Due to inflation the coin kept floating away!', ephemeral: false });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.3);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'Heads!', ephemeral: false });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.6);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'Tails!', ephemeral: false });
  });
});
