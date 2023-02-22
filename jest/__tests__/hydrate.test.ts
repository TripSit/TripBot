import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dHydrate } from '../../src/discord/commands/global/d.hydrate';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dHydrate;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
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
