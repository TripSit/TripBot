/* eslint-disable max-len */

import {
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { stripIndents } from 'common-tags';
import { dInvite } from '../../discord/commands/global/d.invite';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';
import log from '../../global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dInvite;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = dInvite.data;
    const stringCommand = `/${commandData.name}`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyReply(dInvite, command);
    expect(spy).toHaveBeenCalledWith(embedContaining({
      author: {
        iconURL: 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png',
        name: 'TripSit.Me',
        url: 'http://www.tripsit.me',
      },
      color: Colors.DarkBlue,
      footer: {
        iconURL: 'https://imgur.com/b923xK2.png',
        text: 'Dose responsibly!',
      },
      title: 'Invite TripBot',
      url: 'https://discord.com/api/oauth2/authorize?client_id=957780726806380545&permissions=18432&scope=bot%20applications.commands',
      description: stripIndents`
      [Click here to invite TripBot to your own server](https://discord.com/api/oauth2/authorize?client_id=957780726806380545&permissions=18432&scope=bot%20applications.commands).
      Note: For advanced features you will need to give the bot more permissions.
      
      The official support server is [TripSit discord](https://discord.gg/TripSit). 
      If you have issues/questions, join and talk with Moonbear!`,
    }));
  });
});
