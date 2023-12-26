import {
  Colors,
} from 'discord.js';
import { dHelp } from '../../../src/discord/commands/global/d.help';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../../../jest/utils/testutils';

const slashCommand = dHelp;

const authorInfo = {
  iconURL: 'https://i.gyazo.com/b48b08a853fefaafb6393837eec1a501.png',
  name: 'TripSit.Me',
  url: 'http://www.tripsit.me',
};
const footerInfo = {
  iconURL: 'https://i.gyazo.com/19276c297cca0761dc9689ac7c320b8e.png',
  text: 'Dose responsibly!',
};

// This one requires me to register commands with the application.... yeah idk

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
        color: Colors.DarkBlue,
        title: 'Harm Reduction Modules',
        url: 'https://tripsit.me/about/',
        image: {
          url: 'imgur',
        },
        fields: [
          {
            name: 'Drug',
            value: expect.any(String),
            inline: true,
          },
          {
            name: 'Combo',
            value: expect.any(String),
            inline: true,
          },
          {
            name: 'iDose',
            value: expect.any(String),
            inline: true,
          },
          {
            name: 'ComboChart',
            value: expect.any(String),
            inline: true,
          },
          {
            name: 'Reagents',
            value: expect.any(String),
            inline: true,
          },
          {
            name: 'Calc Psychedelics',
            value: expect.any(String),
            inline: true,
          },
          {
            name: 'Calc DXM',
            value: expect.any(String),
            inline: true,
          },
          {
            name: 'Calc Benzos',
            value: expect.any(String),
            inline: true,
          },
          {
            name: 'Calc Ketamine',
            value: expect.any(String),
            inline: true,
          },
          {
            name: 'Recovery',
            value: expect.any(String),
            inline: true,
          },
          {
            name: 'Breathe',
            value: expect.any(String),
            inline: true,
          },
          {
            name: 'Warmline',
            value: expect.any(String),
            inline: true,
          },
          {
            name: 'KIPP',
            value: expect.any(String),
            inline: true,
          },
          {
            name: 'Hydrate',
            value: expect.any(String),
            inline: true,
          },
          {
            name: 'Crisis Information',
            value: expect.any(String),
            inline: true,
          },
        ],
      }),
    });
  });
});
