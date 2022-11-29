import {
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { stripIndents } from 'common-tags';
import { dTestkits } from '../commands/global/d.testkits';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../../../jest/utils/testutils';
import log from '../../global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dTestkits;

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
      title: 'Test Kit Resources and information!',
      description: stripIndents`
      [How to use a reagent test kit](https://dancesafe.org/testing-kit-instructions/)
      [How to use fent strips](https://dancesafe.org/you-may-be-using-fentanyl-testing-strips-incorrectly/)
      [More testkit resources on the TripSit wiki!](https://wiki.tripsit.me/wiki/Test_Kits)
      `,
      fields: [
        {
          name: 'Dosetest (Worldwide)',
          value: stripIndents`
          [Website](https://dosetest.com/)            
          20% off test kits with code TripSit!`,
          inline: true,
        },
        {
          name: 'ReagentTests UK (UK & EU)',
          value: stripIndents`
          [Website](https://www.reagent-tests.uk/shop/)            
          10% off with code tripsitwiki!`,
          inline: true,
        },
      ],
    }));
  });
});
