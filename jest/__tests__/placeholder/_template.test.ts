/* eslint-disable max-len */

import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dAbout } from '../../../src/discord/commands/global/d.about';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../../utils/testutils';

const F = f(__filename); // eslint-disable-line

const slashCommand = dAbout;

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
        color: Colors.DarkBlue,
        title: 'About TripBot',
        url: 'https://tripsit.me/about/',
        description: stripIndents``,
        image: {
          url: 'imgurl',
        },
        fields: [
          {
            name: 'name',
            value: stripIndents`desc`,
            inline: true,
          },
        ],
      }),
    });

    expect(await executeCommandAndSpyReply(
      slashCommand,
      getParsedCommand(
        `/${slashCommand.data.name}`,
        slashCommand.data,
        'dm',
      ),
    )).toHaveBeenCalledWith({
      content: stripIndents`This command can only be used in a discord guild!`,
      ephemeral: true,
    });
  });
});
