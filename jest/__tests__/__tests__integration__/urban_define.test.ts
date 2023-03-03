/* eslint-disable max-len */

import {
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { stripIndents } from 'common-tags';
import { dUrbandefine } from '../commands/archive/d.urbanDefine';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../../utils/testutils';
import log from '../../global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dUrbandefine;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name} define:tripsit`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyReply(slashCommand, command);
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
      description: stripIndents`**Definition for "tripsit" ** (+48/-3)
      Providing a calm environment for people on various psychoactive drugs; making sure the music is right, providing interesting conversation, and generally making things go smoothly for the trippers. Also, the name of an online community that provides this service.
      Example: Tripper: \"I'm home alone on drugs and don't have someone to talk to, I should go on Tripsit!\"`,
    }));
  });
});
