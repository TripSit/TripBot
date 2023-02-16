import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dRemindme } from '../commands/global/d.remindme';

const F = f(__filename); // eslint-disable-line

const slashCommand = dRemindme;

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
