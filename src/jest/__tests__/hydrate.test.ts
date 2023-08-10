import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dHydrate } from '../../discord/commands/global/d.hydrate';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dHydrate;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    expect(await executeCommandAndSpyEditReply(
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
