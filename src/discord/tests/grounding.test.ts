import { parse } from 'path';
import { dGrounding } from '../commands/global/d.grounding';
import { executeCommandAndSpyEditReply, getParsedCommand } from '../../jest/utils/testutils';
import log from '../../global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dGrounding;

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
      content: 'https://imgur.com/wEg2xFB',
    });
  });
});
