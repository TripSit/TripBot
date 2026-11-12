import {
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { stripIndents } from 'common-tags';
import { dKipp } from '../commands/global/d.kipp';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../../utils/testutils';
import log from '../../global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dKipp;

// TODO(#1289): This test doesnt work because it will return a random selection of emojis and idk how to get that to work

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name}`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(F, `command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyEditReply(slashCommand, command);
    expect(spy).toHaveBeenCalledWith(embedContaining({
      color: Colors.Purple,
      author: undefined,
      footer: undefined,
      description: stripIndents`🤗 😄 😊 🤣 😜 🤪 😍 🙃
      💜Keep It Positive Please!💜
      ✌ 😇 😸 👍 😆 😍 😄 🙂`,
    }));
  });
});
