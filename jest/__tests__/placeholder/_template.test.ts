/* eslint-disable max-len */

import {
  Colors,
} from 'discord.js';
import { stripIndents } from 'common-tags';
import { dAbout } from '../../../src/discord/commands/global/d.about';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../../utils/testutils';

const F = f(__filename); // eslint-disable-line

const slashCommand = dAbout;

const authorInfo = {
  iconURL: 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png',
  name: 'TripSit.Me',
  url: 'http://www.tripsit.me',
};

const footerInfo = {
  iconURL: 'https://imgur.com/b923xK2.png',
  text: 'Dose responsibly!',
};

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name}`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyReply(slashCommand, command);
    expect(spy).toHaveBeenCalledWith({
      embeds: embedContaining({
        author: authorInfo,
        footer: footerInfo,
        color: Colors.DarkBlue,
        title: 'About TripBot',
        url: 'https://tripsit.me/about/',
        description: stripIndents`This app is created by TripSit, an organisation which helps to provide factual information        about drugs and how to reduce the harms involved in using them.
              The official support server is [TripSit discord](https://discord.gg/TripSit). If you have issues/questions, join and talk with Moonbear!`,
        fields: [
          {
            name: 'Invite',
            value: stripIndents`[Click here to invite TripBot to your own server](https://discord.com/api/oauth2/authorize?client_id=957780726806380545&permissions=18432&scope=bot%20applications.commands).
                  Note: For advanced features you will need to give the bot more permissions at your discression.`,
          },
        ],
      }),
    });
  });
});
