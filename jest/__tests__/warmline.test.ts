import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dWarmline } from '../../src/discord/commands/global/d.warmline';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dWarmline;

const authorInfo = {
  iconURL: 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png',
  name: 'TripSit.Me',
  url: 'http://www.tripsit.me',
};
const footerInfo = {
  iconURL: 'https://imgur.com/b923xK2.png',
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
