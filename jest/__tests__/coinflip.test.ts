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
    )).toHaveBeenCalledWith('The coin slipped into subspace and disappeared?!');

    jest.spyOn(global.Math, 'random').mockReturnValue(0.01);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith('The coin landed on its side?!');

    jest.spyOn(global.Math, 'random').mockReturnValue(0.02);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith('The coin rolled off the table?!');

    jest.spyOn(global.Math, 'random').mockReturnValue(0.03);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith(expect.any(String));

    jest.spyOn(global.Math, 'random').mockReturnValue(0.04);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith('The coin kept spinning in the air?!');

    jest.spyOn(global.Math, 'random').mockReturnValue(0.96);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith('Some kid came and took your coin!');

    jest.spyOn(global.Math, 'random').mockReturnValue(0.97);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith(expect.any(String));

    jest.spyOn(global.Math, 'random').mockReturnValue(0.98);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith('You refuse to observe the coin so it is both heads and tails!');

    jest.spyOn(global.Math, 'random').mockReturnValue(0.99);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith(expect.any(String));

    jest.spyOn(global.Math, 'random').mockReturnValue(1);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith('Due to inflation the coin kept floating away!');

    jest.spyOn(global.Math, 'random').mockReturnValue(0.3);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith('Heads!');

    jest.spyOn(global.Math, 'random').mockReturnValue(0.6);
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith('Tails!');
  });
});
