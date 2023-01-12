import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dCalcpsychedelics } from '../../../src/discord/commands/global/d.calcPsychedelics';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../../utils/testutils';

const slashCommand = dCalcpsychedelics;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name} lsd last_dose:300 days:3 desired_dose:400`;
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
      title: 'Bot Stats',
      url: 'https://tripsit.me/about/',
      description: stripIndents`Description`,
      fields: [
        {
          name: 'Name',
          value: stripIndents`Value`,
          inline: true,
        },
      ],
    }));
  });
});
