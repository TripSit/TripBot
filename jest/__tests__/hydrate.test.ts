import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dHydrate } from '../../src/discord/commands/global/d.hydrate';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dHydrate;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name}`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyReply(slashCommand, command);
    expect(spy).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.DarkBlue,
        author: undefined,
        footer: undefined,
        description: stripIndents`
      💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊
      ⚠️ ＨＹＤＲＡＴＩＯＮ ＲＥＭＩＮＤＥＲ ⚠️
      💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊💧🌊`,
      }),
    });
  });
});
