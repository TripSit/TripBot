import {
  Colors,
} from 'discord.js';
import { parse } from 'path';
import { stripIndents } from 'common-tags';
import { dDonate } from '../../src/discord/commands/global/d.donate';
import { executeCommandAndSpyReply, embedContaining, getParsedCommand } from '../utils/testutils';
import log from '../../src/global/utils/log'; // eslint-disable-line

const PREFIX = parse(__filename).name; // eslint-disable-line

const slashCommand = dDonate;

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
      title: 'Donate to keep TripSit running and fund our future projects!',
      url: 'https://tripsit.me/donate/',
      description: stripIndents`The best way to support us is to join the discord and help out people!
      We run on volunteers and need your help to keep the org going
      If you can donate, our preferred method is Patreon, and we're happy for all donation sizes!
      You can get supporter benefits for as little as $1 a month!`,
      fields: [
        {
          name: 'Patreon (Preferred)',
          value: stripIndents`[Website](https://patreon.com/tripsit)`,
          inline: true,
        },
        {
          name: 'Discord Boosts',
          value: stripIndents`[Website](http://discord.gg/TripSit)`,
          inline: true,
        },
        {
          name: '\u200B', value: '\u200B', inline: true,
        },
        {
          name: 'Spreadshop',
          value: stripIndents`[Website](https://tripsit.myspreadshop.com/)`,
          inline: true,
        },
        {
          name: 'Spreadshirt',
          value: stripIndents`[Website](https://www.spreadshirt.com/shop/tripsit/)`,
          inline: true,
        },
        {
          name: '\u200B',
          value: '\u200B',
          inline: true,
        },
      ],
    }));
  });
});
