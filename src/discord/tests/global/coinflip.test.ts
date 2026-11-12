/* eslint-disable max-len */
import { dCoinflip } from '../../commands/global/d.coinflip';
import { executeCommandAndSpyEditReply, getParsedCommand } from '../../../vitest/utils/testutils';

const slashCommand = dCoinflip;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    vi.spyOn(global.Math, 'random').mockReturnValue(0.00);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'The coin slipped into subspace and disappeared?!' });

    vi.spyOn(global.Math, 'random').mockReturnValue(0.01);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'The coin landed on its side?!' });

    vi.spyOn(global.Math, 'random').mockReturnValue(0.02);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'The coin rolled off the table?!' });

    vi.spyOn(global.Math, 'random').mockReturnValue(0.03);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: expect.any(String) });

    vi.spyOn(global.Math, 'random').mockReturnValue(0.04);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'The coin kept spinning in the air?!' });

    vi.spyOn(global.Math, 'random').mockReturnValue(0.96);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'Some kid came and took your coin!' });

    vi.spyOn(global.Math, 'random').mockReturnValue(0.97);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: expect.any(String) });

    vi.spyOn(global.Math, 'random').mockReturnValue(0.98);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'You refuse to observe the coin so it is both heads and tails!' });

    vi.spyOn(global.Math, 'random').mockReturnValue(0.99);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: expect.any(String) });

    vi.spyOn(global.Math, 'random').mockReturnValue(1);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'Due to inflation the coin kept floating away!' });

    vi.spyOn(global.Math, 'random').mockReturnValue(0.3);
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({ content: 'Heads!' });

    vi.spyOn(global.Math, 'random').mockReturnValue(0.6);
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
