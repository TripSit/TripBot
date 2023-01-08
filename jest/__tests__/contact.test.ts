import {
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { stripIndents } from 'common-tags';
import { dContact } from '../../src/discord/commands/global/d.contact';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';
import log from '../../src/global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dContact;

describe(slashCommand.data.name, () => {
  it(slashCommand.data.description, async () => {
    const commandData = slashCommand.data;
    const stringCommand = `/${commandData.name}`;
    const command = getParsedCommand(stringCommand, commandData);
    // log.debug(`[${PREFIX}] command: ${JSON.stringify(command, null, 2)}`);
    const spy = await executeCommandAndSpyReply(slashCommand, command);
    expect(spy).toHaveBeenCalledWith({
      embeds: embedContaining({
        color: Colors.Purple,
        author: {
          iconURL: 'https://fossdroid.com/images/icons/me.tripsit.tripmobile.13.png',
          name: 'TripSit.Me',
          url: 'http://www.tripsit.me',
        },
        footer: {
          iconURL: undefined,
          text: 'Thanks for asking!',
        },
        title: 'Contact TripSit',
        url: 'https://tripsit.me/contact-us/',
        description: stripIndents`The best way to get in contact with TeamTripsit the Discord via the link below!
      If you have a problem with the bot, join the discord and talk to Moonbear#1024!
      Or you can use /bug to report a bug, or you can DM the bot to submit feedback!`,
        fields: [
          {
            name: 'Discord',
            value: stripIndents`[Join our discord](http://discord.gg/TripSit)`,
            inline: true,
          },
          {
            name: 'Bot Issues Email',
            value: stripIndents`discord@tripsit.me`,
            inline: true,
          },
          {
            name: 'Drug Info Issues Email',
            value: stripIndents`content@tripsit.me`,
            inline: true,
          },
        ],
      }),
    });
  });
});
