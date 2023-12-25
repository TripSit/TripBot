import { parse } from 'path';
import { dlovebomb } from '../commands/global/d.lovebomb';
import { executeCommandAndSpyEditReply, getParsedCommand } from '../../jest/utils/testutils';
import log from '../../global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dlovebomb;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyEditReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith(expect.any(String));
  });
});
