import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dDonate } from '../../src/discord/commands/global/d.donate';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dDonate;

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
        footer: footerInfo,
        color: Colors.Purple,
        title: 'Donate to keep TripSit running and fund our future projects!',
        url: 'https://tripsit.me/donate/',
        description: stripIndents`The best way to support us is to join the discord and help out people!
      We run on volunteers and need your help to keep the org going
      If you can donate, our preferred method is Patreon, and we're happy for all donation sizes!
      You can get supporter benefits for as little as $1 a month!`,
        fields: [
          {
            name: 'Patreon (Preferred)',
            value: stripIndents`[Website](https://patreon.com/tripsit)`,
            inline: true,
          },
          {
            name: 'Discord Boosts',
            value: stripIndents`[Website](http://discord.gg/TripSit)`,
            inline: true,
          },
          {
            name: '\u200B', value: '\u200B', inline: true,
          },
          {
            name: 'Spreadshop',
            value: stripIndents`[Website](https://tripsit.myspreadshop.com/)`,
            inline: true,
          },
          {
            name: 'Spreadshirt',
            value: stripIndents`[Website](https://www.spreadshirt.com/shop/tripsit/)`,
            inline: true,
          },
          {
            name: '\u200B',
            value: '\u200B',
            inline: true,
          },
        ],
      }),
    });
  });
});
