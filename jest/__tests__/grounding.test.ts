import { parse } from 'path';
import { dGrounding } from '../../src/discord/commands/global/d.grounding';
import { executeCommandAndSpyReply, getParsedCommand } from '../utils/testutils';
import log from '../../src/global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dGrounding;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({
      content: 'https://imgur.com/wEg2xFB',
      ephemeral: false,
    });
  });
});
