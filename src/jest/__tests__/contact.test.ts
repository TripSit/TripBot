import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dContact } from '../../src/discord/commands/global/d.contact';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dContact;

const authorInfo = {
  iconURL: 'https://i.gyazo.com/b48b08a853fefaafb6393837eec1a501.png',
  name: 'TripSit.Me',
  url: 'http://www.tripsit.me',
};
// const footerInfo = {
//   iconURL: 'https://i.gyazo.com/19276c297cca0761dc9689ac7c320b8e.png',
//   text: 'Dose responsibly!',
// };

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
        author: authorInfo,
        footer: {
          iconURL: undefined,
          text: 'Thanks for asking!',
        },
        color: Colors.Purple,
        title: 'Contact TripSit',
        url: 'https://tripsit.me/contact-us/',
        description: stripIndents`The best way to get in contact with TeamTripsit the Discord via the link below!
      If you have a problem with the bot, join the discord and talk to Moonbear#1024!
      Or you can use /bug to report a bug, or you can DM the bot to submit feedback!`,
        fields: [
          {
            name: 'Discord',
            value: stripIndents`[Join our discord](http://discord.gg/TripSit)`,
            inline: true,
          },
          {
            name: 'Bot Issues Email',
            value: stripIndents`discord@tripsit.me`,
            inline: true,
          },
          {
            name: 'Drug Info Issues Email',
            value: stripIndents`content@tripsit.me`,
            inline: true,
          },
        ],
      }),
    });
  });
});
