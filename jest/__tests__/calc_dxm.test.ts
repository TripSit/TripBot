import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dCalcdxm } from '../../src/discord/commands/global/d.calcDXM';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';

const slashCommand = dCalcdxm;

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
        `/${slashCommand.data.name} calc_weight:200 units:kg taking:RoboCough (ml)`,
        slashCommand.data,
        'tripsit',
      ),
    )).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.Purple,
        title: 'DXM Dosages',
        description: stripIndents`For a 200kg individual taking RoboCough (ml)`,
        fields: [
          {
            name: 'Plateau',
            value: stripIndents`**First**`,
            inline: true,
          },
          {
            name: 'Minimum',
            value: stripIndents`30 (ml)`,
            inline: true,
          },
          {
            name: 'Maximum',
            value: stripIndents`50 (ml)`,
            inline: true,
          },
          {
            name: '\u200B',
            value: stripIndents`**Second**`,
            inline: true,
          },
          {
            name: '\u200B',
            value: stripIndents`50 (ml)`,
            inline: true,
          },
          {
            name: '\u200B',
            value: stripIndents`150 (ml)`,
            inline: true,
          },
          {
            name: '\u200B',
            value: stripIndents`**Third**`,
            inline: true,
          },
          {
            name: '\u200B',
            value: stripIndents`150 (ml)`,
            inline: true,
          },
          {
            name: '\u200B',
            value: stripIndents`300 (ml)`,
            inline: true,
          },
          {
            name: '\u200B',
            value: stripIndents`**Fourth**`,
            inline: true,
          },
          {
            name: '\u200B',
            value: stripIndents`300 (ml)`,
            inline: true,
          },
          {
            name: '\u200B',
            value: stripIndents`400 (ml)`,
            inline: true,
          },
        ],
      }),
    });
  });
});
