import {
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { dHelp } from '../commands/global/d.help';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../../../jest/utils/testutils';
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
    const spy = await executeCommandAndSpyReply(slashCommand, command);
    expect(spy).toHaveBeenCalledWith(embedContaining({
      color: Colors.Purple,
      author: {
        iconURL: 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png',
        name: 'TripSit.Me',
        url: 'http://www.tripsit.me',
      },
      footer: {
        iconURL: 'https://imgur.com/b923xK2.png',
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
