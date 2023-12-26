import { parse } from 'path';
import { dImgur } from '../../../src/discord/commands/global/d.imgur';
import { executeCommandAndSpyEditReply, getParsedCommand } from '../../../jest/utils/testutils';
import log from '../../../src/global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dImgur;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name} kittens`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(F, `command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyEditReply(slashCommand, command);
    expect(spy).toHaveBeenCalledWith('https://i.imgur.com/tbtmFGJ.png');
  });
});
