import {
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { stripIndents } from 'common-tags';
import { dKarma } from '../commands/guild/d.karma';
import { executeCommandAndSpyEditReply, embedContaining, getParsedCommand } from '../../utils/testutils';
import log from '../../global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dKarma;

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
