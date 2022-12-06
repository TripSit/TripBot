import {
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { stripIndents } from 'common-tags';
import { dCalcketamine } from '../../src/discord/commands/global/d.calcKetamine';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';
import log from '../../src/global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dCalcketamine;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name} weight:130.4 units:kg`;
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
      fields: [
        {
          name: 'Insufflated',
          value: stripIndents`
          **Threshold**: 29mg
          **Light**: 43mg
          **Common**: 86mg
          **Strong**: 144mg-216mg
          **KHole**: 287mg`,
          inline: true,
        },
        {
          name: 'Rectal',
          value: stripIndents`
          **Threshold**: 29mg
          **Light**: 43mg
          **Common**: 86mg
          **Strong**: 144mg-216mg
          **KHole**: 287mg`,
          inline: true,
        },
      ],
    }));
  });
});
