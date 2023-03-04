import {
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { dHelp } from '../commands/global/d.help';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../../utils/testutils';
import log from '../../global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dHelp;

// This one requires me to register commands with the application.... yeah idk

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name}`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyEditReply(slashCommand, command);
    expect(spy).toHaveBeenCalledWith(embedContaining({
      color: Colors.Purple,
      author: {
        iconURL: 'https://i.gyazo.com/b48b08a853fefaafb6393837eec1a501.png',
        name: 'TripSit.Me',
        url: 'http://www.tripsit.me',
      },
      footer: {
        iconURL: 'https://i.gyazo.com/19276c297cca0761dc9689ac7c320b8e.png',
        text: 'Dose responsibly!',
      },
      title: 'Harm Reduction Modules',
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
          name: 'EMS',
          value: expect.any(String),
          inline: true,
        },
      ],
    }));
  });
});
