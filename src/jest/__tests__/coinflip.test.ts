/* eslint-disable max-len */
import { dCoinflip } from '../../discord/commands/global/d.coinflip';
import { executeCommandAndSpyEditReply, getParsedCommand } from '../utils/testutils';

const slashCommand = dCoinflip;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0.00);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'The coin slipped into subspace and disappeared?!' });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.01);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'The coin landed on its side?!' });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.02);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'The coin rolled off the table?!' });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.03);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: expect.any(String) });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.04);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'The coin kept spinning in the air?!' });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.96);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'Some kid came and took your coin!' });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.97);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: expect.any(String) });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.98);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'You refuse to observe the coin so it is both heads and tails!' });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.99);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: expect.any(String) });

    jest.spyOn(global.Math, 'random').mockReturnValue(1);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'Due to inflation the coin kept floating away!' });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.3);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'Heads!' });

    jest.spyOn(global.Math, 'random').mockReturnValue(0.6);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'Tails!' });
  });
});
