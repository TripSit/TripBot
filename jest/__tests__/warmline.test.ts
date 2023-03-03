import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dWarmline } from '../../src/discord/commands/global/d.warmline';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dWarmline;

const authorInfo = {
  iconURL: 'https://i.gyazo.com/b48b08a853fefaafb6393837eec1a501.png',
  name: 'TripSit.Me',
  url: 'http://www.tripsit.me',
};
const footerInfo = {
  iconURL: 'https://i.gyazo.com/19276c297cca0761dc9689ac7c320b8e.png',
  text: 'Dose responsibly!',
};

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
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title: 'Warmline Information',
        fields: [
          {
            name: 'Warmline Directory (Worldwide)',
            value: stripIndents`[Website](https://warmline.org/warmdir.html#directory)`,
            inline: true,
          },
        ],
      }),
      ephemeral: false,
    });
  });
});
